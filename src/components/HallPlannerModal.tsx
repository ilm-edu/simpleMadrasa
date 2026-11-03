import React, { useState } from "react";
import { X, Check } from "lucide-react";
import { ExamHall } from "../types";

interface HallPlannerModalProps {
  halls: ExamHall[];
  hallDayMapping: Record<number, string[]>;
  setHallDayMapping: (mapping: Record<number, string[]>) => void;
  maxDays: number;
  onClose: () => void;
}

export default function HallPlannerModal({
  halls,
  hallDayMapping,
  setHallDayMapping,
  maxDays,
  onClose
}: HallPlannerModalProps) {
  const [mapping, setMapping] = useState<Record<number, string[]>>(() => {
    const initialMapping = { ...hallDayMapping };
    for (let day = 1; day <= maxDays; day++) {
      if (!initialMapping[day]) {
        initialMapping[day] = halls.map(h => h.id);
      }
    }
    return initialMapping;
  });

  const toggleHall = (day: number, hallId: string) => {
    const currentHalls = mapping[day] || [];
    const newHalls = currentHalls.includes(hallId)
      ? currentHalls.filter(id => id !== hallId)
      : [...currentHalls, hallId];
    setMapping(prev => ({ ...prev, [day]: newHalls }));
  };

  const save = () => {
    setHallDayMapping(mapping);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Hall Planner</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-[auto_1fr] gap-4">
            {Array.from({ length: maxDays }).map((_, idx) => {
              const day = idx + 1;
              return (
                <React.Fragment key={day}>
                  <div className="font-semibold text-gray-700 py-2">Day {day}</div>
                  <div className="flex flex-wrap gap-2">
                    {halls.map(hall => {
                      const isSelected = (mapping[day] || []).includes(hall.id);
                      return (
                        <button
                          key={hall.id}
                          onClick={() => toggleHall(day, hall.id)}
                          className={`px-3 py-1 rounded-lg border text-sm transition-colors ${
                            isSelected
                              ? "bg-emerald-600 text-white border-emerald-700"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {hall.name}
                        </button>
                      );
                    })}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
          <button onClick={save} className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2">
            <Check size={18} /> Save Plan
          </button>
        </div>
      </div>
    </div>
  );
}
