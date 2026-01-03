import { createRouter, createWebHistory } from "vue-router";

const APP_TITLE = "Throw For Broke";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/views/LandingView.vue"),
      meta: { title: "Home" },
    },
    {
      path: "/game",
      name: "game",
      component: () => import("@/views/GameView.vue"),
      meta: { title: "Run" },
    },
  ],
});

// Set tab title: "Throw For Broke | <Page>"
router.afterEach((to) => {
  const page = (to.meta.title as string | undefined) ?? "";
  document.title = page ? `${APP_TITLE} | ${page}` : APP_TITLE;
});
