import { useState } from 'react';
import { format, addDays, eachDayOfInterval, getDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Copy, CalendarRange, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AddSlotDialogProps {
  onSlotAdded: () => void;
}

interface TimeSlotEntry {
  id: string;
  start_time: string;
  end_time: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الإثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
  { value: 6, label: 'السبت' },
];

export const AddSlotDialog = ({ onSlotAdded }: AddSlotDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState<'weekly' | 'date_range' | 'specific_dates'>('weekly');
  
  // Weekly mode
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotEntry[]>([
    { id: '1', start_time: '09:00', end_time: '10:00' }
  ]);
  
  // Date range mode
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  
  // Specific dates mode
  const [specificDates, setSpecificDates] = useState<Date[]>([]);
  
  // Common options
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const addTimeSlot = () => {
    const lastSlot = timeSlots[timeSlots.length - 1];
    const [hours, minutes] = lastSlot.end_time.split(':');
    const nextHour = (parseInt(hours) + 1) % 24;
    const nextEnd = (nextHour + 1) % 24;
    
    setTimeSlots([
      ...timeSlots,
      {
        id: Date.now().toString(),
        start_time: `${nextHour.toString().padStart(2, '0')}:${minutes}`,
        end_time: `${nextEnd.toString().padStart(2, '0')}:${minutes}`,
      }
    ]);
  };

  const removeTimeSlot = (id: string) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter(s => s.id !== id));
    }
  };

  const updateTimeSlot = (id: string, field: 'start_time' | 'end_time', value: string) => {
    setTimeSlots(timeSlots.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const duplicateTimeSlot = (slot: TimeSlotEntry) => {
    setTimeSlots([
      ...timeSlots,
      { ...slot, id: Date.now().toString() }
    ]);
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const generateQuickSlots = (type: 'morning' | 'afternoon' | 'evening' | 'all_day') => {
    let slots: TimeSlotEntry[] = [];
    const baseId = Date.now();
    
    switch (type) {
      case 'morning':
        slots = [
          { id: `${baseId}-1`, start_time: '09:00', end_time: '10:00' },
          { id: `${baseId}-2`, start_time: '10:00', end_time: '11:00' },
          { id: `${baseId}-3`, start_time: '11:00', end_time: '12:00' },
        ];
        break;
      case 'afternoon':
        slots = [
          { id: `${baseId}-1`, start_time: '13:00', end_time: '14:00' },
          { id: `${baseId}-2`, start_time: '14:00', end_time: '15:00' },
          { id: `${baseId}-3`, start_time: '15:00', end_time: '16:00' },
          { id: `${baseId}-4`, start_time: '16:00', end_time: '17:00' },
        ];
        break;
      case 'evening':
        slots = [
          { id: `${baseId}-1`, start_time: '18:00', end_time: '19:00' },
          { id: `${baseId}-2`, start_time: '19:00', end_time: '20:00' },
          { id: `${baseId}-3`, start_time: '20:00', end_time: '21:00' },
        ];
        break;
      case 'all_day':
        for (let h = 9; h < 21; h++) {
          slots.push({
            id: `${baseId}-${h}`,
            start_time: `${h.toString().padStart(2, '0')}:00`,
            end_time: `${(h + 1).toString().padStart(2, '0')}:00`,
          });
        }
        break;
    }
    
    setTimeSlots(slots);
  };

  const handleSubmit = async () => {
    if (timeSlots.length === 0) {
      toast({ title: 'خطأ', description: 'يرجى إضافة فترة زمنية واحدة على الأقل', variant: 'destructive' });
      return;
    }

    if (mode === 'weekly' && selectedDays.length === 0) {
      toast({ title: 'خطأ', description: 'يرجى اختيار يوم واحد على الأقل', variant: 'destructive' });
      return;
    }

    if (mode === 'date_range' && (!dateRange.from || !dateRange.to)) {
      toast({ title: 'خطأ', description: 'يرجى تحديد نطاق التاريخ', variant: 'destructive' });
      return;
    }

    if (mode === 'specific_dates' && specificDates.length === 0) {
      toast({ title: 'خطأ', description: 'يرجى اختيار تاريخ واحد على الأقل', variant: 'destructive' });
      return;
    }

    setAdding(true);

    try {
      const slotsToInsert: Array<{
        day_of_week: number;
        start_time: string;
        end_time: string;
        is_active: boolean;
        recurrence_type: string;
        start_date: string | null;
        end_date: string | null;
        specific_dates: string[];
      }> = [];

      if (mode === 'weekly') {
        // Weekly recurring slots
        for (const day of selectedDays) {
          for (const slot of timeSlots) {
            slotsToInsert.push({
              day_of_week: day,
              start_time: slot.start_time,
              end_time: slot.end_time,
              is_active: true,
              recurrence_type: 'weekly',
              start_date: null,
              end_date: hasEndDate && endDate ? format(endDate, 'yyyy-MM-dd') : null,
              specific_dates: [],
            });
          }
        }
      } else if (mode === 'date_range') {
        // Date range - create slots for each day in range
        const days = eachDayOfInterval({ start: dateRange.from!, end: dateRange.to! });
        for (const day of days) {
          const dayOfWeek = getDay(day);
          for (const slot of timeSlots) {
            slotsToInsert.push({
              day_of_week: dayOfWeek,
              start_time: slot.start_time,
              end_time: slot.end_time,
              is_active: true,
              recurrence_type: 'date_range',
              start_date: format(dateRange.from!, 'yyyy-MM-dd'),
              end_date: format(dateRange.to!, 'yyyy-MM-dd'),
              specific_dates: [],
            });
          }
        }
      } else if (mode === 'specific_dates') {
        // Specific dates - one slot entry per time slot with all dates
        const dateStrings = specificDates.map(d => format(d, 'yyyy-MM-dd'));
        for (const slot of timeSlots) {
          slotsToInsert.push({
            day_of_week: getDay(specificDates[0]),
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_active: true,
            recurrence_type: 'specific_dates',
            start_date: null,
            end_date: null,
            specific_dates: dateStrings,
          });
        }
      }

      // Insert slots (remove duplicates by unique key)
      const uniqueSlots = slotsToInsert.filter((slot, index, self) =>
        index === self.findIndex(s =>
          s.day_of_week === slot.day_of_week &&
          s.start_time === slot.start_time &&
          s.end_time === slot.end_time &&
          s.recurrence_type === slot.recurrence_type &&
          s.start_date === slot.start_date &&
          s.end_date === slot.end_date
        )
      );

      const { error } = await supabase
        .from('consultation_slots')
        .insert(uniqueSlots);

      if (error) throw error;

      toast({ 
        title: 'تم الإضافة بنجاح', 
        description: `تمت إضافة ${uniqueSlots.length} فترة زمنية` 
      });
      
      // Reset form
      setSelectedDays([]);
      setTimeSlots([{ id: '1', start_time: '09:00', end_time: '10:00' }]);
      setDateRange({ from: undefined, to: undefined });
      setSpecificDates([]);
      setHasEndDate(false);
      setEndDate(undefined);
      setOpen(false);
      onSlotAdded();

    } catch (error) {
      console.error('Error adding slots:', error);
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء إضافة الفترات', variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-gold gap-2">
          <Plus className="w-4 h-4" />
          إضافة فترات زمنية
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-gold" />
            إضافة فترات زمنية جديدة
          </DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="weekly" className="gap-2">
              <Repeat className="w-4 h-4" />
              أسبوعي متكرر
            </TabsTrigger>
            <TabsTrigger value="date_range" className="gap-2">
              <CalendarRange className="w-4 h-4" />
              نطاق تاريخ
            </TabsTrigger>
            <TabsTrigger value="specific_dates" className="gap-2">
              <CalendarIcon className="w-4 h-4" />
              تواريخ محددة
            </TabsTrigger>
          </TabsList>

          {/* Weekly Mode */}
          <TabsContent value="weekly" className="space-y-6 mt-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold">اختر أيام الأسبوع</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      selectedDays.includes(day.value)
                        ? 'bg-gold text-background border-gold'
                        : 'bg-secondary border-border hover:border-gold/50'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])}
                >
                  جميع الأيام
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedDays([0, 1, 2, 3, 4])}
                >
                  أيام العمل
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedDays([5, 6])}
                >
                  عطلة نهاية الأسبوع
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedDays([])}
                >
                  إلغاء التحديد
                </Button>
              </div>
            </div>

            {/* Optional end date for weekly */}
            <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
              <Switch
                checked={hasEndDate}
                onCheckedChange={setHasEndDate}
              />
              <div className="flex-1">
                <Label>تحديد تاريخ انتهاء</Label>
                <p className="text-sm text-muted-foreground">الفترات ستكون متاحة حتى هذا التاريخ</p>
              </div>
              {hasEndDate && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start">
                      <CalendarIcon className="w-4 h-4 ml-2" />
                      {endDate ? format(endDate, 'dd/MM/yyyy') : 'اختر التاريخ'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </TabsContent>

          {/* Date Range Mode */}
          <TabsContent value="date_range" className="space-y-6 mt-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold">حدد نطاق التاريخ</Label>
              <div className="flex gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start">
                      <CalendarIcon className="w-4 h-4 ml-2" />
                      {dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : 'من تاريخ'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start">
                      <CalendarIcon className="w-4 h-4 ml-2" />
                      {dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : 'إلى تاريخ'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                      disabled={(date) => dateRange.from ? date < dateRange.from : date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {dateRange.from && dateRange.to && (
                <p className="text-sm text-muted-foreground">
                  عدد الأيام: {eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).length} يوم
                </p>
              )}
            </div>
          </TabsContent>

          {/* Specific Dates Mode */}
          <TabsContent value="specific_dates" className="space-y-6 mt-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold">اختر تواريخ محددة</Label>
              <Calendar
                mode="multiple"
                selected={specificDates}
                onSelect={(dates) => setSpecificDates(dates || [])}
                disabled={(date) => date < new Date()}
                className="rounded-xl border bg-card"
              />
              {specificDates.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {specificDates.map((date, i) => (
                    <Badge 
                      key={i} 
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/20"
                      onClick={() => setSpecificDates(specificDates.filter((_, idx) => idx !== i))}
                    >
                      {format(date, 'dd/MM', { locale: ar })}
                      <Trash2 className="w-3 h-3 mr-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Time Slots Section - Common for all modes */}
        <div className="space-y-4 mt-6 pt-6 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" />
              الفترات الزمنية
            </Label>
            <div className="flex gap-2">
              <Select onValueChange={(v) => generateQuickSlots(v as 'morning' | 'afternoon' | 'evening' | 'all_day')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="إضافة سريعة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">فترة صباحية</SelectItem>
                  <SelectItem value="afternoon">فترة ظهيرة</SelectItem>
                  <SelectItem value="evening">فترة مسائية</SelectItem>
                  <SelectItem value="all_day">يوم كامل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 max-h-[250px] overflow-y-auto">
            {timeSlots.map((slot, index) => (
              <div 
                key={slot.id} 
                className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
              >
                <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">من</Label>
                    <Input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => updateTimeSlot(slot.id, 'start_time', e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">إلى</Label>
                    <Input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => updateTimeSlot(slot.id, 'end_time', e.target.value)}
                      className="bg-background"
                    />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => duplicateTimeSlot(slot)}
                    title="نسخ"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeTimeSlot(slot.id)}
                    disabled={timeSlots.length === 1}
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" onClick={addTimeSlot} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            إضافة فترة أخرى
          </Button>
        </div>

        {/* Summary */}
        <div className="bg-gold/10 rounded-lg p-4 mt-6">
          <p className="text-sm font-medium text-foreground">
            ملخص: سيتم إضافة{' '}
            <span className="text-gold font-bold">
              {mode === 'weekly' && selectedDays.length * timeSlots.length}
              {mode === 'date_range' && dateRange.from && dateRange.to && 
                eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).length * timeSlots.length}
              {mode === 'specific_dates' && specificDates.length * timeSlots.length}
            </span>{' '}
            فترة زمنية
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={adding} className="btn-gold">
            {adding ? 'جاري الإضافة...' : 'إضافة الفترات'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
