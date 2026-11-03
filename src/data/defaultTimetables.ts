import { OfficialBoardTimetable } from "../types";

const OFFICIAL_CLASSES_TIMETABLE = {
  "1": [
    { "dayNum": 1, "dateStr": "24-10-2026 (Sat)", "subject": "അദ്ദീനിയാത്ത് വൽ അഖ്ലാഖ് വൽ ഇംലാഅ്", "timeStr": "07:00 AM - 09:00 AM" },
    { "dayNum": 2, "dateStr": "25-10-2026 (Sun)", "subject": "അൽ ഖിറാഅത്ത് വൽ കിതാബത്ത് (തഫ്ഹീമു തിലാവ)", "timeStr": "06:30 AM - 08:30 AM" }
  ],
  "Class 1": [
    { "dayNum": 1, "dateStr": "24-10-2026 (Sat)", "subject": "അദ്ദീനിയാത്ത് വൽ അഖ്ലാഖ് വൽ ഇംലാഅ്", "timeStr": "07:00 AM - 09:00 AM" },
    { "dayNum": 2, "dateStr": "25-10-2026 (Sun)", "subject": "അൽ ഖിറാഅത്ത് വൽ കിതാബത്ത് (തഫ്ഹീമു തിലാവ)", "timeStr": "06:30 AM - 08:30 AM" }
  ],
  "2": [
    { "dayNum": 1, "dateStr": "26-10-2026 (Mon)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 2, "dateStr": "29-10-2026 (Thu)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 3, "dateStr": "31-10-2026 (Sat)", "subject": "അൽ അഖീദ", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 4, "dateStr": "01-11-2026 (Sun)", "subject": "അൽ ഖുർആൻ, ഹിഫ്ള്", "timeStr": "08:00 AM - 09:30 AM" }
  ],
  "Class 2": [
    { "dayNum": 1, "dateStr": "26-10-2026 (Mon)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 2, "dateStr": "29-10-2026 (Thu)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 3, "dateStr": "31-10-2026 (Sat)", "subject": "അൽ അഖീദ", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 4, "dateStr": "01-11-2026 (Sun)", "subject": "അൽ ഖുർആൻ, ഹിഫ്ള്", "timeStr": "08:00 AM - 09:30 AM" }
  ],
  "3": [
    { "dayNum": 1, "dateStr": "25-10-2026 (Sun)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 2, "dateStr": "26-10-2026 (Mon)", "subject": "അൽ അഖീദ", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 3, "dateStr": "27-10-2026 (Tue)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 4, "dateStr": "28-10-2026 (Wed)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 5, "dateStr": "31-10-2026 (Sat)", "subject": "അത്താരീഖ്", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 6, "dateStr": "01-11-2026 (Sun)", "subject": "അൽ ഖുർആൻ വ തദ്രീബു തിലാവ, ഹിഫ്ള്", "timeStr": "08:00 AM - 09:30 AM" }
  ],
  "Class 3": [
    { "dayNum": 1, "dateStr": "25-10-2026 (Sun)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 2, "dateStr": "26-10-2026 (Mon)", "subject": "അൽ അഖീദ", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 3, "dateStr": "27-10-2026 (Tue)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 4, "dateStr": "28-10-2026 (Wed)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 5, "dateStr": "31-10-2026 (Sat)", "subject": "അത്താരീഖ്", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 6, "dateStr": "01-11-2026 (Sun)", "subject": "അൽ ഖുർആൻ വ തദ്രീബു തിലാവ, ഹിഫ്ള്", "timeStr": "08:00 AM - 09:30 AM" }
  ],
  "4": [
    { "dayNum": 1, "dateStr": "25-10-2026 (Sun)", "subject": "അൽ അഖീദ", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 2, "dateStr": "26-10-2026 (Mon)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 3, "dateStr": "28-10-2026 (Wed)", "subject": "അത്താരീഖ്", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 4, "dateStr": "29-10-2026 (Thu)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 5, "dateStr": "31-10-2026 (Sat)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 6, "dateStr": "01-11-2026 (Sun)", "subject": "അൽ ഖുർആൻ വ തദ്രീബു തിലാവ, ഹിഫ്ള്", "timeStr": "08:00 AM - 09:30 AM" }
  ],
  "Class 4": [
    { "dayNum": 1, "dateStr": "25-10-2026 (Sun)", "subject": "അൽ അഖീദ", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 2, "dateStr": "26-10-2026 (Mon)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 3, "dateStr": "28-10-2026 (Wed)", "subject": "അത്താരീഖ്", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 4, "dateStr": "29-10-2026 (Thu)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 5, "dateStr": "31-10-2026 (Sat)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "08:00 AM - 09:30 AM" },
    { "dayNum": 6, "dateStr": "01-11-2026 (Sun)", "subject": "അൽ ഖുർആൻ വ തദ്രീബു തിലാവ, ഹിഫ്ള്", "timeStr": "08:00 AM - 09:30 AM" }
  ],
  "5": [
    { "dayNum": 1, "dateStr": "25-10-2026 (Sun)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 2, "dateStr": "26-10-2026 (Mon)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 3, "dateStr": "27-10-2026 (Tue)", "subject": "അത്താരീഖ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 4, "dateStr": "28-10-2026 (Wed)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 5, "dateStr": "29-10-2026 (Thu)", "subject": "അത്തജ്വീദ്", "timeStr": "06:30 AM - 08:00 AM" }
  ],
  "Class 5": [
    { "dayNum": 1, "dateStr": "25-10-2026 (Sun)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 2, "dateStr": "26-10-2026 (Mon)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 3, "dateStr": "27-10-2026 (Tue)", "subject": "അത്താരീഖ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 4, "dateStr": "28-10-2026 (Wed)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 5, "dateStr": "29-10-2026 (Thu)", "subject": "അത്തജ്വീദ്", "timeStr": "06:30 AM - 08:00 AM" }
  ],
  "6": [
    { "dayNum": 1, "dateStr": "25-10-2026 (Sun)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 2, "dateStr": "26-10-2026 (Mon)", "subject": "അത്താരീഖ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 3, "dateStr": "27-10-2026 (Tue)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 4, "dateStr": "29-10-2026 (Thu)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 5, "dateStr": "31-10-2026 (Sat)", "subject": "അത്തജ്വീദ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 6, "dateStr": "01-11-2026 (Sun)", "subject": "അൽ ഖുർആൻ, ഹിഫ്ള്", "timeStr": "06:30 AM - 08:00 AM" }
  ],
  "Class 6": [
    { "dayNum": 1, "dateStr": "25-10-2026 (Sun)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 2, "dateStr": "26-10-2026 (Mon)", "subject": "അത്താരീഖ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 3, "dateStr": "27-10-2026 (Tue)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 4, "dateStr": "29-10-2026 (Thu)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 5, "dateStr": "31-10-2026 (Sat)", "subject": "അത്തജ്വീദ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 6, "dateStr": "01-11-2026 (Sun)", "subject": "അൽ ഖുർആൻ, ഹിഫ്ള്", "timeStr": "06:30 AM - 08:00 AM" }
  ],
  "7": [
    { "dayNum": 1, "dateStr": "26-10-2026 (Mon)", "subject": "അത്തജ്വീദ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 2, "dateStr": "27-10-2026 (Tue)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 3, "dateStr": "28-10-2026 (Wed)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 4, "dateStr": "29-10-2026 (Thu)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 5, "dateStr": "31-10-2026 (Sat)", "subject": "അത്താരീഖ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 6, "dateStr": "01-11-2026 (Sun)", "subject": "അൽ ഖുർആൻ, ഹിഫ്ള്", "timeStr": "06:30 AM - 08:00 AM" }
  ],
  "Class 7": [
    { "dayNum": 1, "dateStr": "26-10-2026 (Mon)", "subject": "അത്തജ്വീദ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 2, "dateStr": "27-10-2026 (Tue)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 3, "dateStr": "28-10-2026 (Wed)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 4, "dateStr": "29-10-2026 (Thu)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 5, "dateStr": "31-10-2026 (Sat)", "subject": "അത്താരീഖ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 6, "dateStr": "01-11-2026 (Sun)", "subject": "അൽ ഖുർആൻ, ഹിഫ്ള്", "timeStr": "06:30 AM - 08:00 AM" }
  ],
  "8": [
    { "dayNum": 1, "dateStr": "25-10-2026 (Sun)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 2, "dateStr": "27-10-2026 (Tue)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 3, "dateStr": "28-10-2026 (Wed)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 4, "dateStr": "29-10-2026 (Thu)", "subject": "അത്താരീഖ്", "timeStr": "06:30 AM - 08:00 AM" }
  ],
  "Class 8": [
    { "dayNum": 1, "dateStr": "25-10-2026 (Sun)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 2, "dateStr": "27-10-2026 (Tue)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 3, "dateStr": "28-10-2026 (Wed)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 4, "dateStr": "29-10-2026 (Thu)", "subject": "അത്താരീഖ്", "timeStr": "06:30 AM - 08:00 AM" }
  ],
  "9": [
    { "dayNum": 1, "dateStr": "26-10-2026 (Mon)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 2, "dateStr": "27-10-2026 (Tue)", "subject": "അത്താരീഖ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 3, "dateStr": "28-10-2026 (Wed)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 4, "dateStr": "31-10-2026 (Sat)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "06:30 AM - 08:00 AM" }
  ],
  "Class 9": [
    { "dayNum": 1, "dateStr": "26-10-2026 (Mon)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 2, "dateStr": "27-10-2026 (Tue)", "subject": "അത്താരീഖ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 3, "dateStr": "28-10-2026 (Wed)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 4, "dateStr": "31-10-2026 (Sat)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "06:30 AM - 08:00 AM" }
  ],
  "10": [
    { "dayNum": 1, "dateStr": "26-10-2026 (Mon)", "subject": "അത്തഫ്സീർ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 2, "dateStr": "27-10-2026 (Tue)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 3, "dateStr": "28-10-2026 (Wed)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 4, "dateStr": "29-10-2026 (Thu)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "06:30 AM - 08:00 AM" }
  ],
  "Class 10": [
    { "dayNum": 1, "dateStr": "26-10-2026 (Mon)", "subject": "അത്തഫ്സീർ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 2, "dateStr": "27-10-2026 (Tue)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 3, "dateStr": "28-10-2026 (Wed)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 4, "dateStr": "29-10-2026 (Thu)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "06:30 AM - 08:00 AM" }
  ],
  "+1": [
    { "dayNum": 1, "dateStr": "26-10-2026 (Mon)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 2, "dateStr": "27-10-2026 (Tue)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 3, "dateStr": "28-10-2026 (Wed)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 4, "dateStr": "29-10-2026 (Thu)", "subject": "അത്തഫ്സീർ", "timeStr": "06:30 AM - 08:00 AM" }
  ],
  "Class 11": [
    { "dayNum": 1, "dateStr": "26-10-2026 (Mon)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 2, "dateStr": "27-10-2026 (Tue)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 3, "dateStr": "28-10-2026 (Wed)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 4, "dateStr": "29-10-2026 (Thu)", "subject": "അത്തഫ്സീർ", "timeStr": "06:30 AM - 08:00 AM" }
  ],
  "11": [
    { "dayNum": 1, "dateStr": "26-10-2026 (Mon)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 2, "dateStr": "27-10-2026 (Tue)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 3, "dateStr": "28-10-2026 (Wed)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 4, "dateStr": "29-10-2026 (Thu)", "subject": "അത്തഫ്സീർ", "timeStr": "06:30 AM - 08:00 AM" }
  ],
  "+2": [
    { "dayNum": 1, "dateStr": "25-10-2026 (Sun)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 2, "dateStr": "27-10-2026 (Tue)", "subject": "അത്തഫ്സീർ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 3, "dateStr": "28-10-2026 (Wed)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 4, "dateStr": "29-10-2026 (Thu)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "06:30 AM - 08:00 AM" }
  ],
  "Class 12": [
    { "dayNum": 1, "dateStr": "25-10-2026 (Sun)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 2, "dateStr": "27-10-2026 (Tue)", "subject": "അത്തഫ്സീർ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 3, "dateStr": "28-10-2026 (Wed)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 4, "dateStr": "29-10-2026 (Thu)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "06:30 AM - 08:00 AM" }
  ],
  "12": [
    { "dayNum": 1, "dateStr": "25-10-2026 (Sun)", "subject": "ദുറൂസുൽ ഇഹ്സാൻ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 2, "dateStr": "27-10-2026 (Tue)", "subject": "അത്തഫ്സീർ", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 3, "dateStr": "28-10-2026 (Wed)", "subject": "അൽ ഫിഖ്ഹ്", "timeStr": "06:30 AM - 08:00 AM" },
    { "dayNum": 4, "dateStr": "29-10-2026 (Thu)", "subject": "ലിസാനുൽ ഖുർആൻ", "timeStr": "06:30 AM - 08:00 AM" }
  ]
};

export const SAMASTHA_OFFICIAL_TIMETABLES_TEMPLATE: OfficialBoardTimetable[] = [
  {
    "id": "ardha_varshika_2026",
    "boardName": "Samastha SKJMCC / SKIMVB Board Exam 2026-27 (Half-Yearly)",
    "boardNameMl": "സമസ്ത കേരള ജംഇയ്യത്തുൽ മുഅല്ലിമീൻ (SKJMCC) - അർദ്ധവാർഷിക പരീക്ഷ 2026",
    "academicYear": "2026-27",
    "term": "half_yearly",
    "termMl": "അർദ്ധവാർഷിക പരീക്ഷ",
    "category": "general",
    "categoryMl": "ജനറൽ മദ്റസ",
    "description": "ഔദ്യോഗിക പരീക്ഷാ ടൈംടേബിൾ 2026 - ക്ലാസ് 1 മുതൽ +2 വരെയുള്ള തീയതികളും വിഷയങ്ങളും (സൂപ്പർ അഡ്മിൻ വെരിഫൈഡ്)",
    "timing": "06:30 AM - 08:00 AM",
    "isDefault": true,
    "isVerified": true,
    "source": "superadmin_verified",
    "publishedAt": new Date().toISOString(),
    "lastUpdated": new Date().toISOString(),
    "updatedBy": "Super Admin (Official Verified)",
    "classes": OFFICIAL_CLASSES_TIMETABLE
  },
  {
    "id": "pada_varshika_2026",
    "boardName": "Samastha SKJMCC / SKIMVB Board Exam 2026-27 (Quarterly)",
    "boardNameMl": "സമസ്ത കേരള ജംഇയ്യത്തുൽ മുഅല്ലിമീൻ (SKJMCC) - പാദവാർഷിക പരീക്ഷ 2026",
    "academicYear": "2026-27",
    "term": "quarterly",
    "termMl": "പാദവാർഷിക പരീക്ഷ",
    "category": "general",
    "categoryMl": "ജനറൽ മദ്റസ",
    "description": "ഔദ്യോഗിക പാദവാർഷിക പരീക്ഷാ ടൈംടേബിൾ 2026 - ക്ലാസ് 1 മുതൽ +2 വരെ (സൂപ്പർ അഡ്മിൻ വെരിഫൈഡ്)",
    "timing": "06:30 AM - 08:00 AM",
    "isDefault": false,
    "isVerified": true,
    "source": "superadmin_verified",
    "publishedAt": new Date().toISOString(),
    "lastUpdated": new Date().toISOString(),
    "updatedBy": "Super Admin (Official Verified)",
    "classes": OFFICIAL_CLASSES_TIMETABLE
  },
  {
    "id": "varshika_2027",
    "boardName": "Samastha SKJMCC / SKIMVB Board Exam 2026-27 (Annual)",
    "boardNameMl": "സമസ്ത കേരള ജംഇയ്യത്തുൽ മുഅല്ലിമീൻ (SKJMCC) - കൊല്ലപ്പരീക്ഷ / വാർഷിക പരീക്ഷ 2027",
    "academicYear": "2026-27",
    "term": "annual",
    "termMl": "വാർഷിക പരീക്ഷ",
    "category": "general",
    "categoryMl": "ജനറൽ മദ്റസ",
    "description": "ഔദ്യോഗിക കൊല്ലപ്പരീക്ഷാ ടൈംടേബിൾ 2027 - ക്ലാസ് 1 മുതൽ +2 വരെ (സൂപ്പർ അഡ്മിൻ വെരിഫൈഡ്)",
    "timing": "06:30 AM - 08:00 AM",
    "isDefault": false,
    "isVerified": true,
    "source": "superadmin_verified",
    "publishedAt": new Date().toISOString(),
    "lastUpdated": new Date().toISOString(),
    "updatedBy": "Super Admin (Official Verified)",
    "classes": OFFICIAL_CLASSES_TIMETABLE
  }
];

// Clean slate: no hardcoded default boards imposed on user
export const DEFAULT_OFFICIAL_TIMETABLES: OfficialBoardTimetable[] = [];

