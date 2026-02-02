export const timetable = {
    // Days are 0 (Sunday) to 6 (Saturday)
    // Monday = 1, Tuesday = 2, etc.

    1: [ // Monday
        { start: '10:00', end: '11:00', subjectId: 'SPPM' },
        { start: '11:00', end: '12:00', subjectId: 'IoT' },
        { start: '12:00', end: '13:00', subjectId: 'ADIP' },
        // 1:00 - 2:00 is Lunch (L) - Ignored
        { start: '14:00', end: '15:00', subjectId: 'EPRW' },
        { start: '15:00', end: '18:00', subjectId: 'AA-Lab' },
    ],
    2: [ // Tuesday
        { start: '10:00', end: '11:00', subjectId: 'EPRW' },
        { start: '11:00', end: '12:00', subjectId: 'ADIP' },
        { start: '12:00', end: '13:00', subjectId: 'IoT' },
        // 1:00 - 2:00 is Lunch (U) - Ignored
        { start: '14:00', end: '15:00', subjectId: 'AA' },
    ],
    3: [ // Wednesday
        { start: '10:00', end: '11:00', subjectId: 'AA' },
        { start: '11:00', end: '12:00', subjectId: 'SPPM' },
        // 12:00 - 1:00 is Library - Ignored as per user preference (or we can add if they have a subject for it)
        // The user's list says "Library" which is not in their subject list, so we ignore.
        // 1:00 - 2:00 is Lunch (N) - Ignored
        { start: '14:00', end: '15:00', subjectId: 'CNS' },
    ],
    4: [ // Thursday
        { start: '10:00', end: '11:00', subjectId: 'SPPM' },
        { start: '11:00', end: '12:00', subjectId: 'ADIP' },
        // 12:00 - 1:00 is Library
        // 1:00 - 2:00 is Lunch (C)
        { start: '14:00', end: '15:00', subjectId: 'CNS' },
        { start: '15:00', end: '18:00', subjectId: 'ADIP-Lab' },
    ],
    5: [ // Friday
        { start: '10:00', end: '11:00', subjectId: 'CNS' },
        { start: '11:00', end: '12:00', subjectId: 'AA' },
        { start: '12:00', end: '13:00', subjectId: 'IoT' },
        // 1:00 - 2:00 is Lunch (H)
    ]
};

export const getCurrentSubjectId = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (day === 0 || day === 6) return null; // Weekend

    const keyCurrentTime = hours * 60 + minutes;

    const daySchedule = timetable[day];
    if (!daySchedule) return null;

    for (const slot of daySchedule) {
        const [startH, startM] = slot.start.split(':').map(Number);
        const [endH, endM] = slot.end.split(':').map(Number);

        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        if (keyCurrentTime >= startTotal && keyCurrentTime < endTotal) {
            return slot.subjectId;
        }
    }

    return null;
};
