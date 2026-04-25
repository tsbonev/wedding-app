import type { NLocale } from 'naive-ui'

export const bgBG: NLocale = {
  name: 'bg-BG',
  global: {
    undo: 'Отмяна',
    redo: 'Повторение',
    confirm: 'Потвърждаване',
    clear: 'Изчистване'
  },
  Popconfirm: {
    positiveText: 'Потвърди',
    negativeText: 'Отказ'
  },
  Cascader: {
    placeholder: 'Моля изберете',
    loading: 'Зареждане',
    loadingRequiredMessage: (label: string) => `Моля заредете всички наследници на ${label} преди избор.`
  },
  Time: {
    dateFormat: 'yyyy-MM-dd',
    dateTimeFormat: 'yyyy-MM-dd HH:mm:ss'
  },
  DatePicker: {
    yearFormat: 'yyyy',
    monthFormat: 'MMM',
    dayFormat: 'eeeeee',
    yearTypeFormat: 'yyyy',
    monthTypeFormat: 'yyyy-MM',
    dateFormat: 'yyyy-MM-dd',
    dateTimeFormat: 'yyyy-MM-dd HH:mm:ss',
    quarterFormat: 'yyyy-qqq',
    weekFormat: 'YYYY-w',
    clear: 'Изчистване',
    now: 'Сега',
    confirm: 'Потвърди',
    selectTime: 'Избери час',
    selectDate: 'Избери дата',
    datePlaceholder: 'Избери дата',
    datetimePlaceholder: 'Избери дата и час',
    monthPlaceholder: 'Избери месец',
    yearPlaceholder: 'Избери година',
    quarterPlaceholder: 'Избери тримесечие',
    weekPlaceholder: 'Избери седмица',
    startDatePlaceholder: 'Начална дата',
    endDatePlaceholder: 'Крайна дата',
    startDatetimePlaceholder: 'Начална дата и час',
    endDatetimePlaceholder: 'Крайна дата и час',
    startMonthPlaceholder: 'Начален месец',
    endMonthPlaceholder: 'Краен месец',
    monthBeforeYear: true,
    firstDayOfWeek: 0,
    today: 'Днес'
  },
  DataTable: {
    checkTableAll: 'Избери всички',
    uncheckTableAll: 'Откажи всички',
    confirm: 'Потвърди',
    clear: 'Изчисти'
  },
  LegacyTransfer: {
    sourceTitle: 'Източник',
    targetTitle: 'Цел'
  },
  Transfer: {
    selectAll: 'Избери всички',
    unselectAll: 'Премахни всички',
    clearAll: 'Изчисти',
    total: (num: number) => `Общо ${num} елемента`,
    selected: (num: number) => `${num} избрани елемента`
  },
  Empty: {
    description: 'Няма данни'
  },
  Select: {
    placeholder: 'Моля изберете'
  },
  TimePicker: {
    placeholder: 'Избери час',
    positiveText: 'ОК',
    negativeText: 'Отказ',
    now: 'Сега',
    clear: 'Изчисти'
  },
  Pagination: {
    goto: 'Към',
    selectionSuffix: 'страница'
  },
  DynamicTags: {
    add: 'Добави'
  },
  Log: {
    loading: 'Зареждане'
  },
  Input: {
    placeholder: 'Моля въведете'
  },
  InputNumber: {
    placeholder: 'Моля въведете'
  },
  DynamicInput: {
    create: 'Създай'
  },
  ThemeEditor: {
    title: 'Редактор на теми',
    clearAllVars: 'Изчисти всички променливи',
    clearSearch: 'Изчисти търсенето',
    filterCompName: 'Филтрирай по име на компонент',
    filterVarName: 'Филтрирай по име на променлива',
    import: 'Импорт',
    export: 'Експорт',
    restore: 'Възстанови'
  },
  Image: {
    tipPrevious: 'Предишна (←)',
    tipNext: 'Следваща (→)',
    tipCounterclockwise: 'Обратно на часовниковата стрелка',
    tipClockwise: 'По часовниковата стрелка',
    tipZoomOut: 'Намаляване',
    tipZoomIn: 'Увеличаване',
    tipDownload: 'Изтегляне',
    tipClose: 'Затвори (Esc)',
    tipOriginalSize: 'Оригинален размер'
  },
  Heatmap: {
    less: 'По-малко',
    more: 'Повече',
    monthFormat: 'MMM',
    weekdayFormat: 'eeeeee'
  }
}
