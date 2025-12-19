import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

// 设置中文
dayjs.locale('zh-cn')

// 默认开始日期
const DEFAULT_START_DATE = '2025-12-16'

// 从 localStorage 获取开始日期
export function getStartDate(): dayjs.Dayjs {
  const saved = localStorage.getItem('study_start_date')
  return dayjs(saved || DEFAULT_START_DATE)
}

// 获取学习周期周数 (默认12周)
export function getPlanWeeks(): number {
  return parseInt(localStorage.getItem('plan_duration_weeks') || '12')
}

// 设置开始日期
export function setStartDate(date: string): void {
  localStorage.setItem('study_start_date', date)
  // 触发页面刷新以应用新日期
  window.location.reload()
}

// 获取结束日期
export function getEndDate(): dayjs.Dayjs {
  const weeks = getPlanWeeks()
  // 总天数 = 周数 * 7 - 1 (因为第1天也算在内)
  const totalDays = weeks * 7 - 1
  return getStartDate().add(totalDays, 'day')
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: dayjs.Dayjs | Date | string): string {
  return dayjs(date).format('YYYY-MM-DD')
}

/**
 * 解析日期字符串
 */
export function parseDate(dateStr: string): dayjs.Dayjs {
  return dayjs(dateStr)
}

/**
 * 获取今天的日期字符串
 */
export function getToday(): string {
  return dayjs().format('YYYY-MM-DD')
}

/**
 * 获取今天的 dayjs 对象
 */
export function getTodayDayjs(): dayjs.Dayjs {
  return dayjs()
}

/**
 * 检查学习计划是否已开始
 */
export function hasStarted(): boolean {
  const start = getStartDate()
  return dayjs().isAfter(start) || dayjs().isSame(start, 'day')
}

/**
 * 检查学习计划是否已结束
 */
export function hasEnded(): boolean {
  return dayjs().isAfter(getEndDate(), 'day')
}

/**
 * 计算距离开始还有多少天
 */
export function getDaysUntilStart(): number {
  if (hasStarted()) return 0
  return getStartDate().diff(dayjs(), 'day')
}

/**
 * 计算某个日期是学习计划的第几天
 * 返回 0 表示日期在计划开始之前
 */
export function getDayNumber(date: dayjs.Dayjs | Date | string = dayjs()): number {
  const d = dayjs(date)
  const start = getStartDate()
  const diffDays = d.diff(start, 'day') + 1
  
  // 如果日期在开始之前，返回 0
  if (diffDays < 1) return 0
  
  // 动态上限：总周数 * 7
  const maxDays = getPlanWeeks() * 7
  return Math.min(maxDays, diffDays)
}

/**
 * 计算某个日期是学习计划的第几周
 * 返回 0 表示日期在计划开始之前
 */
export function getWeekNumber(date: dayjs.Dayjs | Date | string = dayjs()): number {
  const dayNumber = getDayNumber(date)
  if (dayNumber === 0) return 0
  return Math.ceil(dayNumber / 7)
}

/**
 * 获取某一天的日期
 */
export function getDateByDayNumber(dayNumber: number): dayjs.Dayjs {
  return getStartDate().add(dayNumber - 1, 'day')
}

/**
 * 获取某一周的日期范围
 */
export function getWeekDateRange(weekNumber: number): { start: dayjs.Dayjs; end: dayjs.Dayjs } {
  const startDay = (weekNumber - 1) * 7 + 1
  const maxDays = getPlanWeeks() * 7
  const endDay = Math.min(weekNumber * 7, maxDays)
  return {
    start: getDateByDayNumber(startDay),
    end: getDateByDayNumber(endDay)
  }
}

/**
 * 格式化日期为友好格式
 */
export function formatDateFriendly(date: dayjs.Dayjs | Date | string): string {
  const d = dayjs(date)
  const today = dayjs()
  
  if (d.isSame(today, 'day')) {
    return '今天'
  }
  if (d.isSame(today.subtract(1, 'day'), 'day')) {
    return '昨天'
  }
  if (d.isSame(today.add(1, 'day'), 'day')) {
    return '明天'
  }
  
  return d.format('M月D日 ddd')
}

/**
 * 计算剩余天数
 */
export function getDaysRemaining(targetDate: dayjs.Dayjs | Date | string): number {
  return dayjs(targetDate).diff(dayjs(), 'day')
}

/**
 * 获取周次主题
 * 已移除硬编码，改为返回默认格式，具体业务逻辑交由组件根据数据动态生成
 */
export function getWeekTheme(weekNumber: number): { theme: string; category: string } {
  return { theme: `第 ${weekNumber} 周学习`, category: 'general' }
}

/**
 * 获取学习进度信息
 */
export function getStudyProgress() {
  const today = dayjs()
  const dayNumber = getDayNumber(today)
  const weekNumber = getWeekNumber(today)
  const totalWeeks = getPlanWeeks()
  const totalDays = totalWeeks * 7
  
  // 计划还没开始
  if (!hasStarted()) {
    return {
      hasStarted: false,
      week: 0,
      day: 0,
      totalDays: 0,
      percentage: 0,
      daysUntilStart: getDaysUntilStart()
    }
  }
  
  // 计划进行中或已结束
  const dayInWeek = dayNumber === 0 ? 0 : ((dayNumber - 1) % 7) + 1
  
  return {
    hasStarted: true,
    week: weekNumber,
    day: dayInWeek,
    totalDays: dayNumber,
    percentage: Math.round((dayNumber / totalDays) * 100),
    daysUntilStart: 0
  }
}

/**
 * 生成日历数据
 */
export function generateCalendarDays(year: number, month: number): Array<{
  date: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  dayNumber: number
  weekNumber: number
}> {
  const firstDay = dayjs(`${year}-${month}-01`)
  const lastDay = firstDay.endOf('month')
  const today = dayjs()
  
  const days: Array<{
    date: string
    day: number
    isCurrentMonth: boolean
    isToday: boolean
    dayNumber: number
    weekNumber: number
  }> = []
  
  // 补充上月日期
  const startWeekday = firstDay.day() || 7 // 转换为周一为1
  for (let i = startWeekday - 1; i > 0; i--) {
    const d = firstDay.subtract(i, 'day')
    days.push({
      date: d.format('YYYY-MM-DD'),
      day: d.date(),
      isCurrentMonth: false,
      isToday: d.isSame(today, 'day'),
      dayNumber: getDayNumber(d),
      weekNumber: getWeekNumber(d)
    })
  }
  
  // 当月日期
  for (let i = 1; i <= lastDay.date(); i++) {
    const d = dayjs(`${year}-${month}-${i}`)
    days.push({
      date: d.format('YYYY-MM-DD'),
      day: i,
      isCurrentMonth: true,
      isToday: d.isSame(today, 'day'),
      dayNumber: getDayNumber(d),
      weekNumber: getWeekNumber(d)
    })
  }
  
  // 补充下月日期
  const remaining = 42 - days.length // 6行7列
  for (let i = 1; i <= remaining; i++) {
    const d = lastDay.add(i, 'day')
    days.push({
      date: d.format('YYYY-MM-DD'),
      day: d.date(),
      isCurrentMonth: false,
      isToday: d.isSame(today, 'day'),
      dayNumber: getDayNumber(d),
      weekNumber: getWeekNumber(d)
    })
  }
  
  return days
}
