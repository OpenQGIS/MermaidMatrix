<script lang="ts">
  import { onMount } from "svelte";

  export let startDate: string = "";
  export let endDate: string = "";
  export let onConfirm: (start: string, end: string) => void = () => {};
  export let onCancel: () => void = () => {};

  const todayStr = new Date().toISOString().slice(0, 10);

  let tempStart = startDate || todayStr;
  let tempEnd = endDate || tempStart;

  // Calendar navigation
  let currentMonth = new Date(tempStart || todayStr);
  if (isNaN(currentMonth.getTime())) currentMonth = new Date();
  currentMonth.setDate(1);

  let selectingStep: "start" | "end" = "start";

  $: year = currentMonth.getFullYear();
  $: month = currentMonth.getMonth(); // 0 - 11

  function prevMonth() {
    currentMonth = new Date(year, month - 1, 1);
  }

  function nextMonth() {
    currentMonth = new Date(year, month + 1, 1);
  }

  interface CalendarDay {
    dateStr: string;
    dayNum: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isInRange: boolean;
    isStart: boolean;
    isEnd: boolean;
  }

  let calendarDays: CalendarDay[] = [];

  $: {
    const days: CalendarDay[] = [];
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Previous month filler days
    const startOffset = (firstDayIndex + 6) % 7; // Monday start: Mon=0, Sun=6
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const ds = prevDate.toISOString().slice(0, 10);
      days.push(createDayObj(ds, d, false));
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      // Local time formatting YYYY-MM-DD
      const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push(createDayObj(ds, d, true));
    }

    // Next month filler days to complete grid (total 35 or 42)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const ds = nextDate.toISOString().slice(0, 10);
      days.push(createDayObj(ds, d, false));
    }

    calendarDays = days;
  }

  function createDayObj(dateStr: string, dayNum: number, isCurrentMonth: boolean): CalendarDay {
    const isToday = dateStr === todayStr;
    const isStart = dateStr === tempStart;
    const isEnd = dateStr === tempEnd;
    const isSelected = isStart || isEnd;
    const isInRange = tempStart && tempEnd && dateStr >= tempStart && dateStr <= tempEnd;

    return {
      dateStr,
      dayNum,
      isCurrentMonth,
      isToday,
      isSelected,
      isInRange,
      isStart,
      isEnd
    };
  }

  function handleDayClick(day: CalendarDay) {
    if (selectingStep === "start") {
      tempStart = day.dateStr;
      tempEnd = day.dateStr;
      selectingStep = "end";
    } else {
      if (day.dateStr < tempStart) {
        tempEnd = tempStart;
        tempStart = day.dateStr;
      } else {
        tempEnd = day.dateStr;
      }
      selectingStep = "start";
    }
  }

  // Quick Presets
  function applyPreset(daysToAdd: number) {
    const now = new Date();
    const s = now.toISOString().slice(0, 10);
    const endD = new Date(now.getTime() + daysToAdd * 86400000);
    const e = endD.toISOString().slice(0, 10);
    tempStart = s;
    tempEnd = e;
    currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  function applyThisWeek() {
    const now = new Date();
    const day = now.getDay() || 7; // Mon = 1, Sun = 7
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    tempStart = monday.toISOString().slice(0, 10);
    tempEnd = sunday.toISOString().slice(0, 10);
  }

  function applyNextWeek() {
    const now = new Date();
    const day = now.getDay() || 7;
    const nextMon = new Date(now);
    nextMon.setDate(now.getDate() - day + 8);
    const nextSun = new Date(nextMon);
    nextSun.setDate(nextMon.getDate() + 6);
    tempStart = nextMon.toISOString().slice(0, 10);
    tempEnd = nextSun.toISOString().slice(0, 10);
    currentMonth = new Date(nextMon.getFullYear(), nextMon.getMonth(), 1);
  }
</script>

<div class="matrix-datepicker-card">
  <!-- Presets Header Bar -->
  <div class="presets-bar">
    <button type="button" class="preset-pill" on:click={() => applyPreset(0)}>今天 (1天)</button>
    <button type="button" class="preset-pill" on:click={() => applyPreset(2)}>未来3天</button>
    <button type="button" class="preset-pill" on:click={applyThisWeek}>本周</button>
    <button type="button" class="preset-pill" on:click={applyNextWeek}>下周</button>
    <button type="button" class="preset-pill" on:click={() => applyPreset(13)}>未来2周</button>
    <button type="button" class="preset-pill" on:click={() => applyPreset(29)}>未来1个月</button>
  </div>

  <!-- Calendar Navigator -->
  <div class="calendar-header">
    <button type="button" class="nav-arrow" on:click={prevMonth}>‹</button>
    <span class="month-title">{year} 年 {month + 1} 月</span>
    <button type="button" class="nav-arrow" on:click={nextMonth}>›</button>
  </div>

  <!-- Weekday Labels -->
  <div class="weekdays-grid">
    <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span class="weekend">六</span><span class="weekend">日</span>
  </div>

  <!-- Days Grid -->
  <div class="days-grid">
    {#each calendarDays as day}
      <button
        type="button"
        class="day-cell"
        class:other-month={!day.isCurrentMonth}
        class:is-today={day.isToday}
        class:is-start={day.isStart}
        class:is-end={day.isEnd}
        class:in-range={day.isInRange}
        on:click={() => handleDayClick(day)}
      >
        {day.dayNum}
      </button>
    {/each}
  </div>

  <!-- Selection Status & Confirmation -->
  <div class="datepicker-footer">
    <div class="range-display">
      <span class="date-badge">{tempStart}</span>
      <span class="sep">至</span>
      <span class="date-badge">{tempEnd}</span>
    </div>

    <div class="footer-buttons">
      <button type="button" class="cancel-btn" on:click={onCancel}>取消</button>
      <button type="button" class="confirm-btn" on:click={() => onConfirm(tempStart, tempEnd)}>确定保存</button>
    </div>
  </div>
</div>

<style>
  .matrix-datepicker-card {
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    padding: 14px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
    width: 320px;
    user-select: none;
    font-size: 13px;
    color: var(--text-normal);
  }

  .presets-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--background-modifier-border);
    margin-bottom: 10px;
  }
  .preset-pill {
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    color: var(--text-muted);
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .preset-pill:hover {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }

  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .month-title {
    font-weight: 600;
    font-size: 13.5px;
  }
  .nav-arrow {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: var(--text-muted);
    padding: 2px 8px;
    border-radius: 4px;
  }
  .nav-arrow:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .weekdays-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-size: 11px;
    color: var(--text-muted);
    margin-bottom: 4px;
  }
  .weekdays-grid .weekend {
    color: var(--text-accent);
  }

  .days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }
  .day-cell {
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    color: var(--text-normal);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.1s ease;
  }
  .day-cell:hover {
    background: var(--background-modifier-hover);
  }
  .day-cell.other-month {
    color: var(--text-faint);
  }
  .day-cell.is-today {
    font-weight: bold;
    color: var(--interactive-accent);
  }
  .day-cell.in-range {
    background: rgba(59, 130, 246, 0.15);
    border-radius: 0;
  }
  .day-cell.is-start {
    background: var(--interactive-accent) !important;
    color: var(--text-on-accent) !important;
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }
  .day-cell.is-end {
    background: var(--interactive-accent) !important;
    color: var(--text-on-accent) !important;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  .datepicker-footer {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--background-modifier-border);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .range-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 11.5px;
  }
  .date-badge {
    background: var(--background-secondary);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: var(--font-monospace);
    font-weight: 500;
  }
  .sep {
    color: var(--text-muted);
  }

  .footer-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .cancel-btn {
    background: none;
    border: 1px solid var(--background-modifier-border);
    padding: 4px 10px;
    border-radius: 4px;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 12px;
  }
  .cancel-btn:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }
  .confirm-btn {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    padding: 4px 12px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    font-size: 12px;
  }
  .confirm-btn:hover {
    filter: brightness(1.1);
  }
</style>
