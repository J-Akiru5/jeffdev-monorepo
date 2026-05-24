import {
  getAvailabilitySlots,
  saveAvailabilitySlot,
  setActiveQuarter,
  deleteAvailabilitySlot,
} from "@/app/actions/availability";
import { AvailabilityManager } from "./availability-manager";

export default async function AvailabilityPage() {
  const result = await getAvailabilitySlots();
  const slots = result.success ? result.data : [];

  return (
    <AvailabilityManager
      initialSlots={slots}
      saveAction={saveAvailabilitySlot}
      setActiveAction={setActiveQuarter}
      deleteAction={deleteAvailabilitySlot}
    />
  );
}
