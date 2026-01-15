import express from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { JobRoutes } from '../modules/job/job.routes';

const router = express.Router();

type Route = { path: string; route: express.Router };

const routes: Route[] = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/jobs',
    route: JobRoutes,
  },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
