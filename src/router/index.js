import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
  // 拓扑
  // {
  //   path: "/",
  //   name: "collectTop",
  //   component: () => import("../views/collectTop/index.vue")
  // },
  {
    path: "/",
    name: "collectTop",
    component: () => import("../views/collectTop/D3.vue")
    // component: () => import("../views/collectTop/D3 copy.vue")
  }

];
const router = new VueRouter({
  mode: "hash",
  base: process.env.BASE_URL,
  routes,
});
// 路由守卫
router.beforeEach((to, from, next) => {
  next()
})
export default router;