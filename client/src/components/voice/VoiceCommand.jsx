import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Mic, Square, Sparkles, CheckCircle2, Pencil, RotateCcw, AlertTriangle, Info, Languages } from 'lucide-react';
import { parseVoiceCommandApi } from '../../api/voice.js';
import { createOperationApi } from '../../api/operations.js';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition.js';
import { Button } from '../ui/Button.jsx';
import { Textarea } from '../ui/Textarea.jsx';
import { VOICE_LANGUAGES, T } from './voiceI18n.js';

const LANG_KEY = 'stocksense-voice-lang';

function readLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return T[saved] ? saved : 'en-IN';
  } catch {
    return 'en-IN';
  }
}

const locName = (warehouse, loc) => (loc ? `${warehouse?.shortCode ?? ''}/${loc.shortCode}`.replace(/^\//, '') : '—');

/** Recompute readiness after the user picks an alternative product. */
function withProduct(result, product) {
  const next = { ...result, product, productAlternatives: result.productAlternatives.filter((p) => p.id !== product.id) };
  if (result.product) next.productAlternatives = [result.product, ...next.productAlternatives].slice(0, 3);
  next.missing = result.missing.filter((m) => m !== 'product');
  next.ready = !next.missing.some((m) => m !== 'contact');
  next.draft = next.ready
    ? {
        type: result.intent.value,
        warehouseId: result.warehouse.id,
        contactId: result.contact?.id ?? null,
        sourceLocationId: result.sourceLocation?.id ?? null,
        destLocationId: result.destLocation?.id ?? null,
        lines: [{ productId: product.id, quantity: result.quantity }],
      }
    : null;
  next.unitNote = null;
  return next;
}

/**
 * Voice-to-Action panel for the operation forms.
 * Speak (or type) a command in English, Hindi or Gujarati → the server parses it →
 * the user sees a plain-language summary and either Confirms (creates a DRAFT operation)
 * or Edits (fills the form fields for manual review).
 *
 * @param {{
 *   contextType: 'RECEIPT'|'DELIVERY'|'INTERNAL',
 *   onEdit: (result: object) => void,
 *   onCreated: (operation: object, type: string) => void,
 * }} props
 */
export function VoiceCommand({ contextType, onEdit, onCreated }) {
  const [lang, setLang] = useState(readLang);
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);
  const t = T[lang];

  const understand = async (commandText) => {
    const value = (commandText ?? text).trim();
    if (value.length < 3) {
      toast.error(t.typeHint);
      return;
    }
    setParsing(true);
    try {
      const res = await parseVoiceCommandApi({ text: value, language: lang, contextType });
      setResult(res.data);
    } catch (err) {
      toast.error(err.message || 'Could not understand the command');
    } finally {
      setParsing(false);
    }
  };

  const speech = useSpeechRecognition({
    onFinal: (finalText) => {
      setText(finalText);
      understand(finalText);
    },
  });

  const changeLang = (code) => {
    setLang(code);
    try {
      localStorage.setItem(LANG_KEY, code);
    } catch {
      // ignore
    }
  };

  const toggleMic = () => {
    if (speech.listening) speech.stop();
    else {
      setResult(null);
      speech.start(lang);
    }
  };

  const confirm = async () => {
    if (!result?.draft) return;
    setCreating(true);
    try {
      const res = await createOperationApi({ ...result.draft, scheduledDate: new Date().toISOString() });
      toast.success(t.created(res.data.reference));
      onCreated(res.data, result.draft.type);
    } catch (err) {
      toast.error(err.message || 'Failed to create the operation');
    } finally {
      setCreating(false);
    }
  };

  const reset = () => {
    setResult(null);
    setText('');
    speech.setTranscript('');
  };

  const liveText = speech.listening ? speech.transcript : text;

  const view = useMemo(() => {
    if (!result) return null;
    const type = result.intent.value;
    const qty = result.quantity != null ? `${result.quantity} ${result.product?.uom ?? result.spokenUnit ?? ''}`.trim() : '—';
    const product = result.product?.name ?? '—';
    const contact = result.contact?.name ?? null;
    const whName = result.warehouse ? `${result.warehouse.name} (${result.warehouse.shortCode})` : '—';
    const src = type === 'RECEIPT' ? null : locName(result.warehouse, result.sourceLocation);
    const dest = type === 'DELIVERY' ? null : locName(result.warehouse, result.destLocation);
    const summary = t.summary[type]({ qty, product, contact, src, dest: type === 'RECEIPT' ? whName : dest });

    const rows = [
      [t.fields.operation, t.types[type], result.intent.source === 'spoken'],
      [t.fields.product, result.product ? `${result.product.name} · ${result.product.sku}` : null, Boolean(result.product)],
      [t.fields.quantity, result.quantity != null ? qty : null, result.quantity != null],
    ];
    if (type === 'RECEIPT') rows.push([t.fields.supplier, contact, Boolean(contact), true]);
    if (type === 'DELIVERY') rows.push([t.fields.customer, contact, Boolean(contact), true]);
    rows.push([
      t.fields.warehouse,
      result.warehouse ? `${whName}${result.warehouse.source === 'default' ? ` · ${t.defaultWarehouse}` : ''}` : null,
      Boolean(result.warehouse),
    ]);
    if (src) rows.push([t.fields.from, src, Boolean(result.sourceLocation)]);
    if (dest && type !== 'RECEIPT') rows.push([t.fields.to, dest, Boolean(result.destLocation)]);
    if (type === 'RECEIPT') rows.push([t.fields.to, locName(result.warehouse, result.destLocation), Boolean(result.destLocation)]);
    return { type, summary, rows };
  }, [result, t]);

  return (
    <section
      aria-label={t.title}
      className="rounded-xl border border-teal-200 dark:border-teal-900/60 bg-gradient-to-br from-teal-50/80 to-white dark:from-teal-950/30 dark:to-zinc-900 p-4 sm:p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-lg bg-teal-600 text-white shrink-0" aria-hidden="true">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">🎙️ {t.title}</h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-0.5" role="radiogroup" aria-label="Language">
          <Languages className="w-3.5 h-3.5 text-zinc-400 mx-1.5" aria-hidden="true" />
          {VOICE_LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="radio"
              aria-checked={lang === l.code}
              aria-label={l.label}
              onClick={() => changeLang(l.code)}
              className={clsx(
                'px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer min-h-[32px]',
                lang === l.code
                  ? 'bg-teal-600 text-white'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              )}
            >
              {l.native}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-stretch">
        {speech.supported && (
          <button
            type="button"
            onClick={toggleMic}
            aria-pressed={speech.listening}
            aria-label={speech.listening ? t.stop : t.speak}
            className={clsx(
              'relative flex sm:flex-col items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-sm transition-all cursor-pointer min-h-[48px] sm:w-28',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900',
              speech.listening ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
            )}
          >
            {speech.listening && <span className="absolute inset-0 rounded-xl animate-ping bg-rose-500/30" aria-hidden="true" />}
            {speech.listening ? <Square className="w-5 h-5 relative" /> : <Mic className="w-5 h-5" />}
            <span className="relative">{speech.listening ? t.stop : t.speak}</span>
          </button>
        )}
        <div className="flex-1 space-y-2">
          <label htmlFor="voice-command" className="sr-only">
            {t.commandLabel}
          </label>
          <Textarea
            id="voice-command"
            rows={2}
            value={liveText}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                understand();
              }
            }}
            readOnly={speech.listening}
            aria-describedby="voice-hint"
            className={clsx(speech.listening && 'italic text-teal-800 dark:text-teal-300')}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p id="voice-hint" className="text-[11px] text-zinc-500">
              {speech.listening ? t.listening : speech.supported ? t.typeHint : t.notSupported}
            </p>
            <Button type="button" size="sm" variant="secondary" loading={parsing} onClick={() => understand()} disabled={speech.listening}>
              {t.understand}
            </Button>
          </div>
          {speech.error && (
            <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
              {speech.error}
            </p>
          )}
        </div>
      </div>

      {/* Examples */}
      {!result && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-zinc-500">{t.examples}:</span>
          {t.exampleCommands[contextType].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setText(ex);
                understand(ex);
              }}
              className="text-[11px] px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors cursor-pointer"
            >
              “{ex}”
            </button>
          ))}
        </div>
      )}

      {/* Result */}
      {result && view && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3" aria-live="polite">
          <p className="text-xs font-medium text-zinc-500">{t.understood}</p>
          <p className={clsx('text-base font-semibold leading-snug', result.ready ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500')}>
            {view.summary}
          </p>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {view.rows.map(([label, value, ok, optional]) => (
              <div key={label} className="flex items-baseline gap-2 min-w-0">
                <dt className="w-24 shrink-0 text-xs text-zinc-500">{label}</dt>
                <dd className="flex items-center gap-1.5 min-w-0">
                  {ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className={clsx('w-3.5 h-3.5 shrink-0', optional ? 'text-zinc-400' : 'text-amber-500')} aria-hidden="true" />
                  )}
                  <span className={clsx('truncate', value ? 'font-medium text-zinc-900 dark:text-zinc-100' : 'text-zinc-400')}>{value ?? '—'}</span>
                </dd>
              </div>
            ))}
          </dl>

          {result.productAlternatives?.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-zinc-500">{t.didYouMean}</span>
              {result.productAlternatives.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setResult(withProduct(result, p))}
                  className="text-[11px] px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 hover:border-teal-400 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  {p.name} <span className="font-mono text-zinc-400">{p.sku}</span>
                </button>
              ))}
            </div>
          )}

          {(result.unitNote || result.missing.length > 0) && (
            <ul className="space-y-1">
              {result.unitNote?.type === 'converted' && (
                <li className="flex items-start gap-1.5 text-xs text-sky-700 dark:text-sky-400">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                  {t.converted(result.unitNote.from, result.unitNote.to)}
                </li>
              )}
              {result.unitNote?.type === 'mismatch' && (
                <li className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                  {t.mismatch(result.unitNote.spoken, result.unitNote.productUom)}
                </li>
              )}
              {result.missing.map((m) => (
                <li key={m} className={clsx('flex items-start gap-1.5 text-xs', m === 'contact' ? 'text-zinc-500' : 'text-amber-700 dark:text-amber-400')}>
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                  {t.missing[m]}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={confirm}
              loading={creating}
              disabled={!result.ready}
              icon={<CheckCircle2 className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
            >
              {t.confirm[view.type]}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => onEdit(result)} icon={<Pencil className="w-3.5 h-3.5" />}>
              {t.edit}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={reset} icon={<RotateCcw className="w-3.5 h-3.5" />}>
              {t.tryAgain}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
