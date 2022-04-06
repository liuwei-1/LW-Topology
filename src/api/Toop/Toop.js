/**
 * @description 首页接口
 */
 import request from '../axios'
 // 获取拓扑数据
 export const getTreeData = async () => {
     return await request.get('micro/getBasicDeviceTree')
 }
 // 获取拓扑最新召回的拓扑数据
 export const getTreeNewData = async () => {
     return await request.get('micro/getRecallDeviceTree')
 }
 // 获取成功率
 export const getTopuResult = async () => {
     return await request.get('micro/getTopuCheckResult')
 }
 // 点击节点获取信息
 export const getNodeData = async (id) => {
     return await request.get('micro/getRealTimeData?devId='+id)
 }