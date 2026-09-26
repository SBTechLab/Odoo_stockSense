import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { warehousesRouter } from './modules/warehouses/warehouses.routes.js';
import { locationsRouter } from './modules/locations/locations.routes.js';
import { activityRouter } from './modules/activity/activity.routes.js';
import { eventsRouter } from './modules/events/events.routes.js';

// Member 2 stubs
import { contactsRouter } from './modules/contacts/contacts.routes.js';
import { operationsRouter } from './modules/operations/operations.routes.js';
import { adjustmentsRouter } from './modules/adjustments/adjustments.routes.js';

// Member 3 stubs
import { categoriesRouter } from './modules/categories/categories.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { reorderRulesRouter } from './modules/reorder-rules/reorder-rules.routes.js';
import { stockRouter } from './modules/stock/stock.routes.js';
import { movesRouter } from './modules/moves/moves.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { replenishmentRouter } from './modules/replenishment/replenishment.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { searchRouter } from './modules/search/search.routes.js';

export const routes = Router();

// Member 1 (Implemented)
routes.use('/auth', authRouter);
routes.use('/users', usersRouter);
routes.use('/warehouses', warehousesRouter);
routes.use('/locations', locationsRouter);
routes.use('/activity', activityRouter);
routes.use('/events', eventsRouter);

// Member 2 (Stubs)
routes.use('/contacts', contactsRouter);
routes.use('/operations', operationsRouter);
routes.use('/adjustments', adjustmentsRouter);

// Member 3 (Stubs)
routes.use('/categories', categoriesRouter);
routes.use('/products', productsRouter);
routes.use('/reorder-rules', reorderRulesRouter);
routes.use('/stock', stockRouter);
routes.use('/moves', movesRouter);
routes.use('/dashboard', dashboardRouter);
routes.use('/replenishment', replenishmentRouter);
routes.use('/notifications', notificationsRouter);
routes.use('/search', searchRouter);
