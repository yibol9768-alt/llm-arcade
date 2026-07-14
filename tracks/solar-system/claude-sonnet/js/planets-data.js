// 行星数据（轨道半径、尺寸均为压缩后的“可探索”数值，非真实天文比例）
// orbitRadius: 距太阳的轨道半径（场景单位）
// radius: 星球自身半径（场景单位）
// speed: 公转角速度基准（值越大转得越快，已按“看起来合理”的节奏压缩，不与真实周期成正比换算）
// rotSpeed: 自转速度
// color: 基础颜色（十六进制）
// desc: 中文简介信息面板内容

const PLANETS_DATA = [
  {
    key: 'mercury',
    name: '水星',
    enName: 'Mercury',
    orbitRadius: 14,
    radius: 0.9,
    speed: 1.6,
    rotSpeed: 0.4,
    color: 0x9a9a9a,
    emissive: 0x1a1a1a,
    tilt: 0.03,
    facts: [
      '距太阳最近的行星，几乎没有大气层',
      '昼夜温差极大：白天可达430°C，夜晚可降至-180°C',
      '公转周期约88个地球日，是太阳系中年最短的行星',
      '表面布满陨石坑，与月球十分相似'
    ]
  },
  {
    key: 'venus',
    name: '金星',
    enName: 'Venus',
    orbitRadius: 19,
    radius: 1.35,
    speed: 1.2,
    rotSpeed: 0.15,
    color: 0xe8c27a,
    emissive: 0x2a1e0a,
    tilt: 0.04,
    facts: [
      '太阳系中最热的行星，表面温度可达470°C（浓厚温室效应）',
      '自转方向与大多数行星相反，是“逆行自转”',
      '常被称为“地球的姐妹星”，大小与地球接近',
      '天空中最亮的行星，常在黎明或黄昏可见'
    ]
  },
  {
    key: 'earth',
    name: '地球',
    enName: 'Earth',
    orbitRadius: 24,
    radius: 1.4,
    speed: 1.0,
    rotSpeed: 1.0,
    color: 0x2f6fb7,
    emissive: 0x081018,
    tilt: 0.41,
    hasMoon: true,
    facts: [
      '目前已知唯一存在生命的行星',
      '71%的表面被液态水覆盖',
      '拥有一颗天然卫星——月球',
      '公转周期365.25天，即一年'
    ]
  },
  {
    key: 'mars',
    name: '火星',
    enName: 'Mars',
    orbitRadius: 29,
    radius: 1.1,
    speed: 0.8,
    rotSpeed: 0.9,
    color: 0xb1502f,
    emissive: 0x1a0a05,
    tilt: 0.44,
    facts: [
      '因表面氧化铁而呈红色，被称为“红色星球”',
      '拥有太阳系最大的火山——奥林匹斯山',
      '有两颗小卫星：火卫一和火卫二',
      '是人类深空探测和未来载人登陆的重点目标'
    ]
  },
  {
    key: 'jupiter',
    name: '木星',
    enName: 'Jupiter',
    orbitRadius: 38,
    radius: 3.4,
    speed: 0.45,
    rotSpeed: 2.4,
    color: 0xd9b38c,
    emissive: 0x1a140f,
    tilt: 0.05,
    facts: [
      '太阳系中体积和质量最大的行星',
      '标志性的大红斑是持续了数百年的巨型风暴',
      '已知卫星数量超过90颗，其中木卫三是太阳系最大卫星',
      '自转速度极快，一天不到10小时'
    ]
  },
  {
    key: 'saturn',
    name: '土星',
    enName: 'Saturn',
    orbitRadius: 47,
    radius: 2.9,
    speed: 0.34,
    rotSpeed: 2.2,
    color: 0xe3cf9a,
    emissive: 0x1a160f,
    tilt: 0.47,
    hasRing: true,
    facts: [
      '拥有太阳系中最壮观的行星环系统，主要由冰和岩石颗粒组成',
      '密度比水还小，理论上能漂浮在水面上',
      '已确认卫星超过140颗，土卫六拥有浓厚大气层',
      '公转周期约29.5个地球年'
    ]
  },
  {
    key: 'uranus',
    name: '天王星',
    enName: 'Uranus',
    orbitRadius: 55,
    radius: 2.0,
    speed: 0.24,
    rotSpeed: 1.4,
    color: 0x9be3e0,
    emissive: 0x0a1a1a,
    tilt: 1.4,
    hasRing: true,
    ringColor: 0x7fb3b0,
    facts: [
      '自转轴几乎“躺倒”，倾角约98度，像是side滚动公转',
      '呈淡蓝绿色，因大气中含有甲烷',
      '也拥有暗淡的行星环系统',
      '是第一颗通过望远镜发现的行星（1781年）'
    ]
  },
  {
    key: 'neptune',
    name: '海王星',
    enName: 'Neptune',
    orbitRadius: 62,
    radius: 1.95,
    speed: 0.19,
    rotSpeed: 1.5,
    color: 0x3b5fd9,
    emissive: 0x05081a,
    tilt: 0.49,
    facts: [
      '太阳系已知风速最快的行星，风速可超2000公里/小时',
      '呈深蓝色，因大气中甲烷吸收红光',
      '公转周期约165个地球年',
      '是通过数学预测而非直接观测发现的行星'
    ]
  },
  {
    key: 'pluto',
    name: '冥王星',
    enName: 'Pluto',
    orbitRadius: 68,
    radius: 0.7,
    speed: 0.14,
    rotSpeed: 0.6,
    color: 0xcabfa8,
    emissive: 0x14100a,
    tilt: 0.3,
    isDwarf: true,
    facts: [
      '1930年发现，2006年被国际天文学联合会重新归类为“矮行星”',
      '拥有五颗卫星，最大的卡戎几乎与冥王星一样大',
      '轨道倾角和离心率较大，轨道明显“歪斜”',
      '表面温度极低，约零下230°C'
    ]
  }
];

const SUN_DATA = {
  name: '太阳',
  enName: 'Sun',
  radius: 6.5,
  color: 0xffcc33,
  facts: [
    '太阳系的中心天体，占据太阳系总质量的99.8%以上',
    '表面温度约5500°C，核心温度高达1500万°C',
    '通过核聚变将氢转化为氦，持续释放光和热',
    '年龄约46亿年，预计还能稳定燃烧约50亿年'
  ]
};
