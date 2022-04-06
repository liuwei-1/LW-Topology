<template>
  <div class="loginHome">
    <div class="container">
      <div class="leftbox">
        <div class="topbearer">
          <div class="left-btns">
            <div class="toop-title">拓扑校验率</div>
            <div class="success-rate">{{successRate}}%</div>
          </div>
          <div class="right-btns">
            <div class="tpjy" @click="checkToop">拓扑校验</div>
            <div class="tpjyzt res" v-if="issuccess">成功!</div>
            <div class="tpjyzt rej" v-else>失败!</div>
          </div>
        </div>
        <div class="content">
          <div id="main" style="width: 100%; height: 100%;"></div>
        </div>
      </div>
      <div class="rightbox">
        <div class="r-content">
          <div class="top-table">
            <div class="title">工作参数</div>
            <div class="c-tab">
              <div class="t-clum" :class="getgl(index, '工作参数') ? 'bmw' : ''" v-for="(item, index) in parameterData" :key="index">
                <el-tooltip :disabled="(item.name).length < 5" effect="dark" :content="item.name" placement="top">
                  <span class="c-name">{{item.name}}</span>
                </el-tooltip>
                <el-tooltip :disabled="(item.val).length < 7" effect="dark" :content="item.val" placement="top">
                  <span>{{item.val}}</span>
                </el-tooltip>
              </div>
            </div>
          </div>
          <div class="bottom-table">
            <div class="title">实时数据</div>
            <div class="c-tab">
              <div class="t-clum" :class="[getgl(index, '实时数据') ? 'bmw' : '', index%2 === 0 ? 'isborder' : '']" v-for="(item, index) in actuamData" :key="index">
                <el-tooltip :disabled="(item.desc).length < 5" effect="dark" :content="item.desc" placement="top">
                  <span class="c-name">{{item.desc}}</span>
                </el-tooltip>
                <el-tooltip :disabled="(item.value).length < 7" effect="dark" :content="item.value" placement="top">
                  <span>{{item.value}}</span>
                </el-tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getTreeData, getTopuResult, getTreeNewData, getNodeData } from '../../api/Toop/Toop'
import * as echarts from 'echarts'
import lodash from "lodash";
export default {
  name: "homeAbout",
  data() {
    return {
      mapChart: null,
      issuccess: false,
      successRate: 0,
      parameterData: [
        {
          name: '设备名称',
          onlyId: 'name',
          val: ''
        },
        {
          name: '设备ID',
          onlyId: 'devID',
          val: ''
        },
        {
          name: '通信地址',
          onlyId: 'addr',
          val: ''
        },
        {
          name: '额定电流',
          onlyId: 'rgtA',
          val: ''
        },
        {
          name: '软件版本',
          onlyId: 'softVersion',
          val: ''
        },
      ],
      actuamData: [],
      treeData: [
        {
          addr: '',
          devID: '',
          name: '台区变压器',
          children: []
        }
      ]
    };
  },
  created() {
    // 点击节点时添加节流函数
    this.getNodeInformation = lodash.throttle(this.getNodeInformation, 800)
    // 点击拓扑校验时添加节流函数
    this.checkToop = lodash.throttle(this.checkToop, 800)
  },
  mounted() {
    this.mapChart = echarts.init(document.getElementById('main'))
    // 获取拓扑数据
    this.getTopoData()
    // 连接websocket
    this.initWebsocket()
    // 获取成功率
    this.getTopuResult()
  },
  methods: {
    // 右侧表格隔行变色
    getgl(index, type) {
      let forData
      if (type === '工作参数') {forData = this.parameterData}
      if (type === '实时数据') {forData = this.actuamData}
      let arr = []
      forData.forEach((item, num) => {
        let a = 0
        if ((num+1) % 2 === 1) {
          a = 0
        } else {
          a = 1
        }
        arr.push(2*(num+1) - a)
      })
      return arr.indexOf(index) > -1
    },

    //WebSocket
    initWebsocket(){
      this.webSocketObj = new WebSocket('ws://192.168.232.129:9963/websocket/micro_app_01');
      this.webSocketObj.onmessage = this.getMessage
      this.webSocketObj.onopen = this.open
      this.webSocketObj.onerror = this.error
      this.webSocketObj.onclose = this.close
         //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
      window.onbeforeunload = function () {
          this.webSocketObj.close()
      }
    },
    // 监听socket连接
    open() {
        console.log("socket连接成功")
    },
    // 监听socket错误信息
    error() {
        console.log("连接错误")
    },
    // 监听socket消息
    getMessage(msg) {
      const {data, message} = JSON.parse(msg.data)
      if (message == 'topuCheck') {
        // 推送的是拓扑校验结果
        this.mapChart.showLoading({
          color: '#094FA5', //显示转圈的圆圈颜色
          maskColor: '#000000', //显示的背景色
          spinnerRadius: 20,
        })
        // 获取新数据重新渲染树图
        // 再次获取成功率
        this.getTopuResult()
        this.treeData[0].children = this.setTopoData(data.deviceTree)
        // this.treeData = this.setTopoData(data.deviceTree)
        this.setNewTreeData(data.badDeviceList, this.treeData)
        this.renderTree()
        // 为了加载完拓扑后默认展示第一个节点的工作参数和实时数据
        let params = {data: this.treeData[0]}
        this.getNodeInformation(params)
      }
      if (message == 'realtimeData') {
        // 推送的是实时数据消息
      }
      if (message == 'warn') {
        console.log(data, '告警信息');
        // 推送的是告警消息
        let data2 = data.map(item =>item.addr)
        this.setWarnNode(data2, this.treeData, data)
      }
    },
    // 监听socket关闭
    close() {
        console.log("socket已经关闭")
    },

    // 获取拓扑数据
    async getTopoData() {
      this.mapChart.showLoading({
          color: '#094FA5', //显示转圈的圆圈颜色
          maskColor: 'rgba(255,255,255,0)', //显示的背景色
          spinnerRadius: 20,
      })
      const res = await getTreeData()
      if (res.status == 200) {
        this.treeData[0].children = this.setTopoData(res.data.deviceTree)
        // this.treeData = this.setTopoData(res.data.deviceTree)
        this.renderTree()
        // 为了加载完拓扑后默认展示第一个节点的工作参数和实时数据
        let params = {data: this.treeData[0].children[0]}
        this.getNodeInformation(params)
      } else {
        this.mapChart.hideLoading()
      }
    },

    // 获取成功率
    async getTopuResult() {
      const res = await getTopuResult()
      if (res.status == 200) {
        this.issuccess = res.data.currentCheckStatus ? true : false
        this.successRate = res.data.checkRate
      }
    },

    // 拓扑渲染
    renderTree() {
      this.mapChart = echarts.init(document.getElementById('main'))
      const option = {
        tooltip: {
          // item 图形触发， axis 坐标轴触发， none 不触发，这里默认不触发，想触发哪个就给数据单独添加。
          trigger: 'none',
          triggerOn: 'click',
          // formatter: function (params) {
          //   var htmlStr = '<div class="llllllllll" style="height: auto;max-height: 240px;overflow-y: auto;"><p>' + params.data.name + '</p>';
          //   return htmlStr
          // },
          // appendToBody: true
        },
        series: [
          {
            type: 'tree',
            data: this.treeData,
            roam: true,
            left: '2%',
            right: '2%',
            top: '10%',
            bottom: '20%',
            width: 1200,
            symbol: function(a, params){
              if(params.dataIndex === 1) {
                return 'image://' + require('./assets/byq.png')
              } else {
                return 'rect'
              }
            },
            symbolSize: [17, 35], // 节点大小
            orient: 'vertical',
            edgeShape: 'polyline', // curve-区线 和 polyline-直线
            expandAndCollapse: false, // 点击子节点不展开折叠
            label: {
              // 非叶子节点的配置
              position: [120, 10],
              // position: 'right',
              // distance: 50,
              color: '#FFCC00',
              // backgroundColor: '#ccc',
              verticalAlign: 'middle',
              align: 'right',
              fontSize: 15
            },
            lineStyle: {
              // 折线的样式
              color: '#806600',
              width: 2
            },
            itemStyle: {
              color: '#000000',
              borderColor: '#806600',
              borderWidth: 2
            },
            animationDuration: 550,
            animationDurationUpdate: 750
          }
        ]
      }
      // 为数据单独添加tooltip、label、itemStyle、等
      this.mapChart.setOption(option)
      this.mapChart.hideLoading()
      const that = this
      this.mapChart.on('click', function(params){
        that.getNodeInformation(params)
      })
    },

    // 点击节点获取信息
    async getNodeInformation(params) {
      const res = await getNodeData(params.data.devID)
      if(res.status == 200) {
        // 工作参数直接带过来
        this.parameterData.forEach(item => {
          if(item.onlyId === 'name') {
            item.val = params.data.name
          }
          if(item.onlyId === 'devID') {
            item.val = params.data.devID
          }
          if(item.onlyId === 'addr') {
            item.val = params.data.addr
          }
          if(item.onlyId === 'rgtA') {
            item.val = params.data.rgtA
          }
          if(item.onlyId === 'softVersion') {
            item.val = params.data.softVersion
          }
        })
        this.actuamData = res.data.realtimeDataList.map(item => item)
      }
    },

    // 点击拓扑校验
    async checkToop() {
      this.mapChart.showLoading({
        color: '#094FA5', //显示转圈的圆圈颜色
        maskColor: '#000000', //显示的背景色
        spinnerRadius: 20,
      })
      // 获取新数据重新渲染树图
      const res = await getTreeNewData()
      if (res.status == 200) {
        // 再次获取成功率
        this.getTopuResult()
        this.treeData[0].children = this.setTopoData(res.data.deviceTree)
        // this.treeData = this.setTopoData(res.data.deviceTree)
        this.setNewTreeData(res.data.badDeviceList, this.treeData)
        this.renderTree()
        // 为了加载完拓扑后默认展示第一个节点的工作参数和实时数据
        let params = {data: this.treeData[0]}
        this.getNodeInformation(params)
      } else {
        this.mapChart.hideLoading()
      }
    },

    /**
     * 使用正则来修改Tree型json数据中的key属性名：
     * params arrayJsonObj <array> 需要修改的json格式的数组
     */
    setTopoData(arrayJsonObj) {
      let str = JSON.stringify(arrayJsonObj);
      // let reg = new RegExp('devName', 'g');
      // let newStr = str.replace(reg, 'name');

      let reg2 = new RegExp('childrenList', 'g');
      let newStr2 = str.replace(reg2, 'children');
      arrayJsonObj.forEach(item => {
        if(item.childrenList) {
          this.setTopoData(item.childrenList)
        }
      })
      return JSON.parse(newStr2)
    },

    /**
     * 给拓扑数据添加样式，变红
     * params bad <array> 错误的节点
     * params treedata <array> 拓扑数据
     */
    setNewTreeData(bad, treedata) {
      treedata.forEach(item => {
        if(bad.indexOf(item.devID) != -1) {
          item.itemStyle = {
            color: 'red',
            borderColor: 'red'
          }
          item.label = {
            color: 'red'
          }
        } else {
          if(item.children) {
            this.setNewTreeData(bad, item.children)
          }
        }
      })
    },

    /**
     * sockect推送的告警消息，将告警节点标红并添加弹框
     * params data <Array> 告警的节点list
     * params treedata <array> 拓扑数据
     */
    setWarnNode(data, treedata, badData) {
      let arr = []
      badData.forEach(item => {
        item.warnList.forEach(v => {
            arr.push(v)
        })
      })
      let isry = arr.every(v => v.status === 1) // 是否有告警要标红，有就标红，没有就标绿
      treedata.forEach(item => {
        if(data.indexOf(item.addr) > -1 && isry) {
          // 合闸
          item.tooltip = {
            // item 图形触发， axis 坐标轴触发， none 不触发，这里默认不触发，想触发哪个就给数据单独添加。
            trigger: 'item',
            triggerOn: 'click',
            padding: 0,
            backgroundColor: '#011F43',
            borderColor: '#2E7099',
            borderWidth: 2,
            formatter: function (params) {
              let badWarnList = badData.filter(item => {
                // 要显示的告警消息
                return item.addr == params.data.addr
              })
              let str = ''
              badWarnList[0].warnList.forEach(v => {
                str += `<div class="item">${v.desc}</div>`
              })
              let htmlStr = `<div class='tipItem'>
                          <div class="title">告警信息</div>`
                           + str + 
                        `</div>`
              return htmlStr
            },
            appendToBody: true
          },
          item.itemStyle = {
            color: 'green',
            borderColor: 'green'
          }
          item.label = {
            color: 'green'
          }
          this.renderTree()
        } else if(data.indexOf(item.addr) > -1 && !isry) {
          // 分闸
          item.tooltip = {
            // item 图形触发， axis 坐标轴触发， none 不触发，这里默认不触发，想触发哪个就给数据单独添加。
            trigger: 'item',
            triggerOn: 'click',
            padding: 0,
            backgroundColor: '#011F43',
            borderColor: '#2E7099',
            borderWidth: 2,
            formatter: function (params) {
              let badWarnList = badData.filter(item => {
                // 要显示的告警消息
                return item.addr == params.data.addr
              })
              let str = ''
              badWarnList[0].warnList.forEach(v => {
                str += `<div class="item">${v.desc}</div>`
              })
              let htmlStr = `<div class='tipItem'>
                          <div class="title">告警信息</div>`
                           + str + 
                        `</div>`
              return htmlStr
            },
            appendToBody: true
          },
          item.itemStyle = {
            color: 'red',
            borderColor: 'red'
          }
          item.label = {
            color: 'red'
          }
          this.renderTree()
        } else {
          delete item.tooltip
          delete item.itemStyle
          delete item.label
        }
        if (item.children) {
          this.setWarnNode(data, item.children, badData)
        }
      })
    }
  }
};
</script>

<style lang="scss">
.tipItem {
  padding: 0 5px;
  box-sizing: border-box;
  .title {
    height: 36px;
    line-height: 36px;
    text-align: center;
    color: #2FA2FA;
    font-size: 12px;
    border-bottom: 1px solid #00E5FF;
  }
  .item {
    height: 26px;
    color: #FFFFFF;
    font-size: 10px;
    text-align: center;
    line-height: 26px;
  }
}
</style>
<style lang="scss" scoped>
.loginHome {
  width: 100%;
  height: 100%;
  background: url("./assets/bg.png") no-repeat;
  background-size: 100% 100%;
  padding-top: 120px;
  .container {
    height: 100%;
    width: 100%;
    padding: 0 40px 20px 40px;
    box-sizing: border-box;
    .leftbox {
      width: 1280px;
      height: 100%;
      float: left;
      .topbearer {
        height: calc(100% - 840px);
        width: 100%;
        .left-btns {
          width: 50%;
          height: 100%;
          display: flex;
          align-items: center;
          float: left;
          .toop-title {
            width: 158px;
            height: 54px;
            background: url('./assets/titlebj.png') no-repeat;
            background-size: 100% 100%;
            color: #00E5FF;
            text-align: center;
            line-height: 54px;
            font-size: 21px;
            font-weight: bold;
          }
          .success-rate {
            width: 110px;
            height: 50px;
            margin-left: 16px;
            background: url('./assets/success.png') no-repeat;
            background-size: 100% 100%;
            text-align: center;
            line-height: 54px;
            font-size: 22px;
            font-weight: bold;
            font-style:italic;
            color: #008AFF;
          }
        }
        .right-btns {
          width: 50%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: end;
          float: right;
          .tpjy {
            width: 151px;
            height: 40px;
            background: url('./assets/jyicon.png') no-repeat 18px 7px, url('./assets/tpjy.png') no-repeat;
            background-size: 23px 26px, 100% 100%;
            color: #00E5FF;
            line-height: 40px;
            font-size: 20px;
            padding-left: 50px;
            box-sizing: border-box;
            cursor: pointer;
          }
          .tpjyzt {
            width: 80px;
            height: 42px;
            margin-left: 20px;
            text-align: center;
            line-height: 42px;
            font-size: 20px;
          }
          .res {
            color: #32B16C;
            background: url('./assets/res.png') no-repeat;
            background-size: 100% 100%;
          }
          .rej {
            color: #F65C26;
            background: url('./assets/rej.png') no-repeat;
            background-size: 100% 100%;
          }
        }
      }
      .content {
        height: 840px;
        width: 100%;
        background: #000000;
        border: 18px solid #000000;
        box-shadow: inset 0px 0px 0px 2px #806600;
        box-sizing: border-box;
      }
    }
    .rightbox {
      width: 521px;
      height: 100%;
      float: right;
      position: relative;
      .r-content {
        height: 910px;
        width: 520px;
        background: RGBA(9, 45, 88, 0.5) url('./assets/bj.png') no-repeat;
        background-size: 100% 100%;
        position: absolute;
        bottom: 0;
        padding: 26px 20px;
        box-sizing: border-box;
        .top-table {
          height: 210px;
          background: url('./assets/sxbj.png') no-repeat;
          background-size: 100% 100%;
          padding: 0 10px;
          box-sizing: border-box;
          .title {
            height: 56px;
            text-align: center;
            color: #00E5FF;
            font-size: 18px;
            padding-top: 4px;
            box-sizing: border-box;
          }
          .c-tab {
            height: 135px;
            width: 100%;
            background: #0F4A6C;
            border: 1px solid #1593EC;
            border-radius: 8px;
            overflow: hidden;
            .t-clum {
              width: 50%;
              height: 45px;
              float: left;
              span {
                display: block;
                height: 100%;
                width: 50%;
                line-height: 45px;
                float: left;
                color: #ffffff;
                font-size: 14px;
                overflow:hidden;
                white-space:nowrap;
                /*文字超出宽度则显示ellipsis省略号*/
                text-overflow:ellipsis;
              }
            }
          }
        }
        .bottom-table {
          height: 620px;
          background: url('./assets/sjbt.png') no-repeat;
          background-size: 100% 100%;
          margin-top: 26px;
          padding: 0 10px;
          box-sizing: border-box;
          .title {
            height: 56px;
            text-align: center;
            color: #00E5FF;
            font-size: 18px;
            padding-top: 8px;
            box-sizing: border-box;
          }
          .c-tab {
            height: 554px;
            width: 100%;
            background: #0F4A6C;
            border: 1px solid #1593EC;
            border-radius: 8px;
            overflow: auto;
            .t-clum {
              width: 50%;
              height: 45px;
              float: left;
              span {
                display: block;
                height: 100%;
                width: 50%;
                line-height: 45px;
                float: left;
                color: #ffffff;
                font-size: 14px;
                overflow:hidden;
                white-space:nowrap;
                /*文字超出宽度则显示ellipsis省略号*/
                text-overflow:ellipsis;
              }
            }
          }
          .isborder {
            border-right: 1px solid #1593EC ;
          }
          /*滚动条样式*/
          .c-tab::-webkit-scrollbar { /*滚动条整体样式*/
              width: 7px; /*高宽分别对应横竖滚动条的尺寸*/
              height: 5px;
          }
          div::-webkit-scrollbar-thumb { /*滚动条里面小方块*/
              border-radius: 5px;
              background: #044F83;
          }
          div::-webkit-scrollbar-track { /*滚动条里面轨道*/
              border-radius: 0;
              background: #2F2F2F;
          }
        }
        .bmw {
          background: #1B6B9D;
        }
        .c-name {
          padding: 0 20px;
          box-sizing: border-box;
        }
      }
    }
  }
}
</style>
