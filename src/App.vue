<template>
  <div id="app">
    <dv-full-screen-container>
      <router-view></router-view>
    </dv-full-screen-container>
  </div>
</template>

<style lang="scss">
*{
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html,body,#app{
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.el-card{
    box-sizing: border-box;
    border: 0px solid #ccc !important;
  }
     /*滚动条样式*/
  //  宽度高度
  ::-webkit-scrollbar{
    width: 10px;
    height: 10px;
  }
  // 滚动条的滑块
  ::-webkit-scrollbar-thumb{
    background-color:#80c1dd;
    border-radius: 0.1875rem;
  }
</style>
