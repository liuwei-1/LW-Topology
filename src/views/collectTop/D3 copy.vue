<!--
 * @FileDescription: 拓扑图组件
 * @Author: 刘伟
 * @Date: 2022.4.1
 * @LastEditors: 刘伟
 * @LastEditTime: 2022.4.2
 -->
<template>
  <div class="loginHome">
    <div class="chartfa">
      <div
        v-drag
        :style="scaleDom"
        @mousewheel.prevent="scaleFun"
        id="main"
      ></div>
    </div>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { Listdata } from "./data";
export default {
  name: "homeAbout",
  // 拖拽自定义指令
  directives: {
    //注册指令
    drag: function (el) {
      let dragBox = el; //获取当前元素
      dragBox.onmousedown = (e) => {
        e.preventDefault();
        //算出鼠标相对元素的位置
        let disX = e.clientX - dragBox.offsetLeft;
        let disY = e.clientY - dragBox.offsetTop;
        document.onmousemove = (e) => {
          //用鼠标的位置减去鼠标相对元素的位置，得到元素的位置
          e.preventDefault();
          let left = e.clientX - disX;
          let top = e.clientY - disY;
          //移动当前元素
          dragBox.style.left = left + "px";
          dragBox.style.top = top + "px";
        };
        document.onmouseup = (e) => {
          e.preventDefault();
          //鼠标弹起来的时候不再移动
          document.onmousemove = null;
          //预防鼠标弹起来后还会循环（即预防鼠标放上去的时候还会移动）
          document.onmouseup = null;
        };
      };
    },
  },
  data() {
    return {
      domScale: 1,
      myChart: null,
      graparr: [],
      linearr: [
        {
          remark: "上面的大包围线",
          coords: [
            [-330, 1855],
            [900, 1855],
            [900, 1615],
            [-330, 1615],
            [-330, 1855]
          ]
        },
        {
          remark: "内部单独的横线",
          coords: [
            [-160, 1784],
            [840, 1784]
          ]
        },
        {
          remark: "内部虚线包围",
          coords: [
            [-160, 1760],
            [510, 1760],
            [510, 1640],
            [-160, 1640],
            [-160, 1760]
          ]
        }
      ],
    };
  },
  computed: {
    // 初始放大值
    scaleDom: function () {
      return `transform:scale(${this.domScale})`;
    },
  },
  created() {
    console.log(Listdata, ";;;;");
  },
  mounted() {
    var chartDom = document.getElementById("main");
    this.myChart = echarts.init(chartDom, null, { renderer: "svg" }); // 使用svg渲染清晰度比canvas高
    // this.myChart = echarts.init(chartDom, null, {devicePixelRatio: 2.5}); // 使用canvas渲染
    // 数据处理
    this.setdata();
    // 拓扑渲染
    this.renderChart();
    // 注册点击事件
    this.setChartClick();
  },
  methods: {
    // 拓扑渲染
    renderChart() {
      var option = {
        backgroundColor: "#0B1321",
        xAxis: {
          min: -500,
          max: 8000,
          show: false,
          type: "value",
        },
        yAxis: {
          min: 0,
          max: 2000,
          show: false,
          type: "value",
          offset: "50",
        },
        series: [
          {
            type: "graph",
            coordinateSystem: "cartesian2d",
            roam: false,
            label: {
              normal: {
                show: true,
                position: "right",
                color: "#f7b500",
                fontSize: 15,
              },
            },
            itemStyle: {
              normal: {
                label: {
                  show: true,
                  formatter: function (item) {
                    return item.data.devName;
                  },
                },
              },
            },
            data: this.graparr,
          },
          {
            type: "lines",
            polyline: true,
            coordinateSystem: "cartesian2d",
            lineStyle: {
              normal: {
                width: 1.5,
                color: "#f7b500",
                curveness: 0.1,
                opacity: 1,
              },
            },
            data: this.linearr
          },
        ],
      };
      option && this.myChart.setOption(option);
    },

    // 注册点击事件
    setChartClick() {
      this.myChart.on("click", function (param) {
        if (param.dataType == 'node') {
            console.log('点击了节点',param)
        } else {
            console.log('点击了边',param)
        }
      });
    },

    // 数据处理
    setdata() {
      let addGrapData = this.setGraphData(Listdata);
      let addLinesData = this.setLinesData(addGrapData);
      this.setDelayering(addLinesData);
    },

    /**
     * @description 数据添加坐标
     * @param {Array} data 需要修改的json数组
     * @return {Array} 添加了坐标后的数据
     */
    setGraphData(data) {
      /**
       * 该方法只处理三级树形数据
       */
      let rangeX = 150; // 最后一级的左右的偏移量
      let rangeH = 85; // 最后一级的上下间距
      let rangeX1 = 500; // 第三级每个节点左右相距的距离
      data[0].value = [0, 1700]; // 这是最顶端的坐标，默认是[0, 2000]
      let list = data[0].children;
      let num = 0;
      for (let index = 0; index < list.length; index++) {
        if (index == 0) {
          // 第一个节点得默认坐标是[0, 1500], 后面的统计节点X坐标都是在此基础上乘800
          list[index].value = [0, 1500];
        } else {
          if (list[index - 1].children && list[index - 1].children.length > 0) {
            num = num + list[index - 1].children.length; // 前面同级节点下得子节点个数，
          } else {
            num = num + 1; // 如果没有子级或者子级为空就默认加1个，默认有一个子级节点，这样后面才能继续向后，不然会重叠到一起
          }
          list[index].value = [num * rangeX1, 1500]; // 节点得X轴坐标 = 前面节点得子节点个数 * rangeX1， rangeX1是每个最后一级得默认宽度
        }
        list[index].children.forEach((item, len) => {
          let defaultX = list[index].value[0];
          item.value = [defaultX + len * rangeX1 - 330, 1350]; // 这是下一级，X坐标为父级得x + 400 * 第几个，减330是相对于父节点X偏移量
          if (item.children) {
            item.children.forEach((el, i) => {
              let deX = item.value[0];
              let deY = item.value[1];
              el.value = [deX + rangeX, deY - rangeH * (i + 1)]; // 这是最后一级，X相对于父节点偏移150，每个最后一级上下相距80
            });
          }
        });
      }
      return data;
    },

    /**
     * @description 树形数组扁平化
     * @param {Array} source 添加了坐标的json数据
     * @return void
     */
    setDelayering(source) {
      source.forEach((el) => {
        (el.symbolSize = 35),
        (el.symbol = "image://" + require("./assets/jd.png")), //图片路径
        (el.itemStyle = {
          normal: {
            color: "#12b5d0"
          }
        });
        this.graparr.push(el);
        el.linevalue ? this.linearr.push(el.linevalue) : ""; // 将每个节点的线条数组添加到linearr
        el.children && el.children.length > 0 ? this.setDelayering(el.children) : "";
      });
    },

    /**
     * @description 添加了坐标后的数据，再添加轨迹线
     * @param {Array} source 添加了坐标的json数据
     * @return void
     */
    setLinesData(source) {
      /**
       * 每个节点只负责绘制自身上方的线条
       * 防止节点下没有数据会出现多余的线
       */
      source[0].linevalue = {
        // 第一个节点的线是固定的
        coords: [
          [source[0].value[0], source[0].value[1]],
          [source[0].value[0], 1784]  // 这个点是顶部默认线的y坐标
        ],
      };
      let lineslist = source[0].children;
      // 处理第二级的线条
      for (let index = 0; index < lineslist.length; index++) {
        if (index == 0) {
          lineslist[index].linevalue = {
            coords: [
              lineslist[index].value,
              [lineslist[index].value[0], source[0].value[1]]  // 这个点是顶部默认线的y坐标
            ]
          };
        } else {
          lineslist[index].linevalue = {
            coords: [
              lineslist[index].value,
              [lineslist[index].value[0], lineslist[index].value[1] + 60],
              [lineslist[index - 1].value[0], lineslist[index].value[1] + 60]
            ]
          };
        }
        // 处理第三级的线条
        lineslist[index].children.forEach((item, len) => {
          item.linevalue = {
            coords: [item.value, [item.value[0], item.value[1] + 60]]
          };
          if(len == 0) {
            // 当前级第一项单独向右拐弯
            item.linevalue.coords.push([lineslist[index].value[0], item.value[1] + 60])
          } else if(len + 1 == lineslist[index].children.length) {
            // 当前级最后一项，连接到父级节点
            item.linevalue = {
              coords: [
                item.value,
                [item.value[0], item.value[1] + 60],
                [lineslist[index].value[0], item.value[1] + 60],
                [lineslist[index].value[0], lineslist[index].value[1]]
              ]
            };
          }
          // 处理最后一级的线条
          if (item.children) {
            item.children.forEach((el, i) => {
              el.linevalue = {
                coords: [
                  el.value,
                  [item.value[0], el.value[1]] // 连接点x为父级的x
                ]
              }
              if(i + 1 == item.children.length) {
                // 最后一项加垂直线。连接到父节点
                el.linevalue.coords.push([item.value[0], item.value[1]])
              }
            });
          }
        });
      }
      // 
      return source
    },

    // 缩放方法
    scaleFun(e) {
      let direction = e.deltaY > 0 ? "down" : "up";
      if (direction === "up") {
        // 滑轮向上滚动
        this.domScale += 0.05;
      } else {
        // 滑轮向下滚动
        if (this.domScale > 0.2) {
          // 最小缩放
          this.domScale -= 0.05;
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.loginHome {
  width: 100%;
  height: 100%;
  // background: yellow;
  background: url("./assets/bg.png") no-repeat;
  background-size: 100% 100%;
  position: relative;
  .chartfa {
    height: 838px;
    width: 1578px;
    position: absolute;
    top: 50%;
    left: -5px;
    transform: translate(0%, -50%);
    background: pink;
    overflow: hidden;
    #main {
      position: absolute;
      left: -1000px;
      top: -100px;
      height: 200%;
      width: 800%;
    }
  }
}
</style>
