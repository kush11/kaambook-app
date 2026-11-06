import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { TextInput, Portal, Dialog, Button } from 'react-native-paper';
import dayjs from 'dayjs';
import { AttendanceCalendar } from '../attendance/AttendanceCalendar';
import { MonthNavigator } from '../attendance/MonthNavigator';
import { formatDate } from '@/src/utils/date';
import { makeStyles } from '@/src/theme';
import i18n from '@/src/i18n';

interface DatePickerFieldProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  style?: object;
}

// Picks a past-or-today date with the same month calendar the attendance screen uses,
// so it needs no native date-picker module. Future days are disabled by the calendar.
export function DatePickerField({ value, onChange, label = 'Date', style }: DatePickerFieldProps) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const initial = value ? dayjs(value) : dayjs();
  const [year, setYear] = useState(initial.year());
  const [month, setMonth] = useState(initial.month());

  const show = () => {
    const d = value ? dayjs(value) : dayjs();
    setYear(d.year());
    setMonth(d.month());
    setOpen(true);
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    // Nothing after the current month can be picked.
    if (dayjs().year(year).month(month).isSame(dayjs(), 'month')) return;
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  return (
    <>
      <Pressable onPress={show} accessibilityRole="button" accessibilityLabel={label} style={style}>
        <View pointerEvents="none">
          <TextInput
            mode="outlined"
            label={label}
            value={value ? formatDate(value) : ''}
            editable={false}
            right={<TextInput.Icon icon="calendar" />}
          />
        </View>
      </Pressable>
      <Portal>
        <Dialog visible={open} onDismiss={() => setOpen(false)} style={styles.dialog}>
          <Dialog.Content style={styles.content}>
            <MonthNavigator year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
            <AttendanceCalendar
              year={year}
              month={month}
              records={[]}
              selectedDate={value}
              onDayPress={(date) => { onChange(date); setOpen(false); }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)}>{i18n.t('common.cancel')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const useStyles = makeStyles((colors) => ({
  dialog: { backgroundColor: colors.surface },
  content: { paddingHorizontal: 8 },
}));
