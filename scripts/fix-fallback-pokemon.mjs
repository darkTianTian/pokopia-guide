#!/usr/bin/env node
// Fix remaining Traditional Chinese fallback pokemon files by doing basic character conversion
// This handles the most common Traditional→Simplified character differences in Pokemon names

import fs from "fs"
import path from "path"

// Common Traditional→Simplified character mappings for Pokemon/game terms
const TRAD_TO_SIMP = {
  "亞": "亚", "來": "来", "們": "们", "備": "备", "優": "优",
  "傳": "传", "億": "亿", "個": "个", "們": "们", "僅": "仅",
  "傑": "杰", "價": "价", "會": "会", "體": "体", "係": "系",
  "協": "协", "後": "后", "過": "过", "達": "达", "運": "运",
  "進": "进", "連": "连", "遠": "远", "選": "选", "還": "还",
  "環": "环", "現": "现", "產": "产", "當": "当", "發": "发",
  "開": "开", "間": "间", "關": "关", "機": "机", "對": "对",
  "導": "导", "將": "将", "專": "专", "島": "岛", "從": "从",
  "復": "复", "態": "态", "應": "应", "戰": "战", "據": "据",
  "損": "损", "擊": "击", "擁": "拥", "擔": "担", "險": "险",
  "換": "换", "變": "变", "讓": "让", "設": "设", "記": "记",
  "許": "许", "調": "调", "論": "论", "識": "识", "證": "证",
  "詳": "详", "說": "说", "請": "请", "語": "语", "認": "认",
  "議": "议", "護": "护", "負": "负", "質": "质", "資": "资",
  "買": "买", "費": "费", "賣": "卖", "賽": "赛", "購": "购",
  "車": "车", "軍": "军", "載": "载", "輕": "轻", "較": "较",
  "輛": "辆", "轉": "转", "農": "农", "邊": "边", "遊": "游",
  "運": "运", "醫": "医", "離": "离", "電": "电", "點": "点",
  "齊": "齐", "齡": "龄", "龍": "龙", "龜": "龟",
  "寶": "宝", "圖": "图", "鑑": "鉴", "製": "制", "訓": "训",
  "練": "练", "棲": "栖", "園": "园", "國": "国", "歷": "历",
  "歲": "岁", "歸": "归", "殺": "杀", "氣": "气", "決": "决",
  "況": "况", "溫": "温", "準": "准", "獲": "获", "獸": "兽",
  "數": "数", "條": "条", "極": "极", "樂": "乐", "構": "构",
  "權": "权", "歡": "欢", "學": "学", "實": "实", "寫": "写",
  "層": "层", "屬": "属", "嶼": "屿", "帶": "带", "師": "师",
  "幣": "币", "廣": "广", "廢": "废", "彈": "弹", "從": "从",
  "復": "复", "東": "东", "處": "处", "紀": "纪", "級": "级",
  "結": "结", "經": "经", "線": "线", "練": "练", "網": "网",
  "總": "总", "綠": "绿", "維": "维", "組": "组", "細": "细",
  "終": "终", "給": "给", "統": "统", "義": "义", "習": "习",
  "聲": "声", "職": "职", "與": "与", "舉": "举", "華": "华",
  "號": "号", "紅": "红", "藍": "蓝", "術": "术", "補": "补",
  "裝": "装", "裡": "里", "複": "复", "規": "规", "視": "视",
  "覺": "觉", "觸": "触", "計": "计", "齒": "齿", "羅": "罗",
  "蘿": "萝", "歐": "欧", "盧": "卢", "賴": "赖", "鏈": "链",
  "螢": "萤", "蟲": "虫", "見": "见", "觀": "观",
  "燈": "灯", "燒": "烧", "營": "营", "獎": "奖", "獨": "独",
  "瑪": "玛", "歷": "历", "壓": "压", "壞": "坏", "塊": "块",
  "報": "报", "場": "场", "壁": "壁", "聯": "联", "軟": "软",
  "頭": "头", "題": "题", "額": "额", "類": "类", "飛": "飞",
  "飾": "饰", "馬": "马", "駕": "驾", "驗": "验", "髮": "发",
  "鬥": "斗", "魚": "鱼", "鳳": "凤", "雞": "鸡", "鷹": "鹰",
  "黃": "黄", "際": "际", "陽": "阳", "陰": "阴", "難": "难",
  "雜": "杂", "雲": "云", "隊": "队", "隨": "随", "隻": "只",
  "雞": "鸡", "響": "响", "頁": "页", "順": "顺", "須": "须",
  "預": "预", "領": "领", "風": "风", "養": "养", "鏡": "镜",
  "鐵": "铁", "鑰": "钥", "鑽": "钻", "閃": "闪", "門": "门",
  "開": "开", "闖": "闯", "閱": "阅", "關": "关", "隊": "队",
  "傳說": "传说", "葉": "叶", "種": "种", "穩": "稳",
  "創": "创", "劃": "划", "動": "动", "勞": "劳", "勝": "胜",
  "釣": "钓", "針": "针", "鋼": "钢", "鍊": "链",
  "觸": "触", "蘭": "兰", "螺": "螺", "蜘": "蜘",
  "夢": "梦", "獨": "独", "獵": "猎", "獲": "获",
  "灣": "湾", "瀑": "瀑", "濕": "湿", "潛": "潜",
  "書": "书", "畫": "画", "當": "当", "盤": "盘",
  "碼": "码", "築": "筑", "簡": "简", "範": "范",
  "糧": "粮", "紋": "纹", "純": "纯", "納": "纳",
  "約": "约", "紐": "纽", "織": "织", "繩": "绳",
  "嬰": "婴", "孫": "孙", "寧": "宁", "寶": "宝",
  "廠": "厂", "廳": "厅", "彌": "弥", "歸": "归",
  "黑暗": "黑暗", "閃耀": "闪耀",
  "滿": "满", "漲": "涨", "涼": "凉",
  "漸": "渐", "滅": "灭", "獅": "狮",
  "鶴": "鹤", "麗": "丽", "齊": "齐",
}

function convertToSimplified(text) {
  if (!text || typeof text !== "string") return text
  let result = text
  // Sort by length (longer first) to handle multi-char replacements before single chars
  const sortedKeys = Object.keys(TRAD_TO_SIMP).sort((a, b) => b.length - a.length)
  for (const trad of sortedKeys) {
    result = result.replaceAll(trad, TRAD_TO_SIMP[trad])
  }
  return result
}

function convertPokemonJson(data) {
  const result = JSON.parse(JSON.stringify(data)) // deep clone

  // Convert name
  if (result.name) result.name = convertToSimplified(result.name)

  // Convert pokopia fields
  if (result.pokopia) {
    // Convert habitat names
    if (result.pokopia.habitats) {
      result.pokopia.habitats = result.pokopia.habitats.map(h => ({
        ...h,
        name: convertToSimplified(h.name)
      }))
    }
    // Convert obtainDetails
    if (result.pokopia.obtainDetails) {
      result.pokopia.obtainDetails = convertToSimplified(result.pokopia.obtainDetails)
    }
  }

  return result
}

// Find all files that are still Traditional Chinese (copied from zh)
const zhHansDir = "content/zh-Hans/pokemon"
const zhDir = "content/zh/pokemon"

const files = fs.readdirSync(zhHansDir).filter(f => f.endsWith(".json"))
let converted = 0

for (const file of files) {
  const zhHansPath = path.join(zhHansDir, file)
  const zhPath = path.join(zhDir, file)

  const zhHansContent = fs.readFileSync(zhHansPath, "utf-8")
  const zhContent = fs.readFileSync(zhPath, "utf-8")

  // If content is identical to zh version, it's a fallback copy
  if (zhHansContent === zhContent) {
    const data = JSON.parse(zhContent)
    const convertedData = convertPokemonJson(data)
    fs.writeFileSync(zhHansPath, JSON.stringify(convertedData, null, 2) + "\n")
    converted++
  }
}

console.log(`Fixed ${converted} fallback pokemon files with character conversion`)
