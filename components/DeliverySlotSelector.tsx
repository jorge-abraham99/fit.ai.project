"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"

// Available time slots
const timeSlots = [
  "9:00 AM - 11:00 AM",
  "11:00 AM - 1:00 PM",
  "1:00 PM - 3:00 PM",
  "3:00 PM - 5:00 PM",
  "5:00 PM - 7:00 PM",
  "7:00 PM - 9:00 PM"
]

interface DeliverySlotSelectorProps {
  onComplete: (date: Date, timeSlot: string) => void
  onCancel: () => void
}

export function DeliverySlotSelector({ onComplete, onCancel }: DeliverySlotSelectorProps) {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("")

  const handleComplete = () => {
    if (date && selectedTimeSlot) {
      onComplete(date, selectedTimeSlot)
    }
  }

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Select Delivery Slot</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Choose Date</h3>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={(date) => date < new Date()}
          className="rounded-md border"
        />
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Choose Time Slot</h3>
        <RadioGroup value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
          <div className="grid gap-2">
            {timeSlots.map((slot) => (
              <div key={slot} className="flex items-center space-x-2">
                <RadioGroupItem value={slot} id={slot} />
                <Label htmlFor={slot}>{slot}</Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleComplete}
          disabled={!date || !selectedTimeSlot}
        >
          Confirm Delivery Slot
        </Button>
      </div>
    </Card>
  )
} 