"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePropertyGroup } from "@/hooks/usePropertyGroup";
import {
  useCreateProperty,
  useUpdateProperty,
} from "@/features/landlord/hooks/useProperties";
import { toast } from "sonner";
import type { Property, PropertyType } from "@/types/domain.types";

const propertyTypeOptions: Array<{ value: PropertyType; label: string }> = [
  { value: "BOARDING_HOUSE", label: "Boarding House" },
  { value: "APARTMENT_BUILDING", label: "Apartment Building" },
  { value: "CONDO", label: "Condo" },
  { value: "SINGLE_FAMILY", label: "Single Family" },
  { value: "COMMERCIAL_MIXED", label: "Commercial Mixed" },
  { value: "OTHER", label: "Other" },
];

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Unable to create property. Please try again.";
}

interface AddPropertyFormProps {
  onClose: () => void;
  propertyToEdit?: Property | null;
  onSaved?: (property: Property) => void;
}

export function AddPropertyForm({
  onClose,
  propertyToEdit = null,
  onSaved,
}: AddPropertyFormProps) {
  const { pgId } = usePropertyGroup();
  const router = useRouter();
  const createProperty = useCreateProperty(pgId);
  const updateProperty = useUpdateProperty(pgId, propertyToEdit?.id ?? "");
  const isEditMode = !!propertyToEdit;

  const [propertyType, setPropertyType] = useState<PropertyType>(
    propertyToEdit?.propertyType ?? "BOARDING_HOUSE",
  );
  const [propertyName, setPropertyName] = useState(
    propertyToEdit?.propertyName ?? "",
  );
  const [addressLine, setAddressLine] = useState(
    propertyToEdit?.addressLine ?? "",
  );
  const [city, setCity] = useState(propertyToEdit?.city ?? "");
  const [province, setProvince] = useState(propertyToEdit?.province ?? "");
  const [postalCode, setPostalCode] = useState(
    propertyToEdit?.postalCode ?? "",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const payload = {
        propertyType,
        propertyName,
        addressLine,
        city,
        province: province || undefined,
        postalCode: postalCode || undefined,
      };
      const saved =
        isEditMode && propertyToEdit
          ? await updateProperty.mutateAsync(payload)
          : await createProperty.mutateAsync(payload);

      toast.success(isEditMode ? "Property updated" : "Property created");
      onSaved?.(saved);
      onClose();
      if (!isEditMode) {
        router.push(`/${pgId}/properties/${saved.id}`);
      }
    } catch (error) {
      toast.error(
        isEditMode
          ? "Unable to update property. Please try again."
          : getErrorMessage(error),
      );
    }
  }

  const isSubmitting = createProperty.isPending || updateProperty.isPending;

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="propertyType"
          >
            Property Type
          </label>
          <select
            id="propertyType"
            value={propertyType}
            onChange={(event) =>
              setPropertyType(event.target.value as PropertyType)
            }
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            required
          >
            {propertyTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="propertyName"
          >
            Property Name
          </label>
          <Input
            id="propertyName"
            value={propertyName}
            onChange={(event) => setPropertyName(event.target.value)}
            placeholder="Sunrise Residences"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="addressLine"
          >
            Address
          </label>
          <Input
            id="addressLine"
            value={addressLine}
            onChange={(event) => setAddressLine(event.target.value)}
            placeholder="123 Main Street"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="city">
            City
          </label>
          <Input
            id="city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Quezon City"
            required
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="province"
          >
            Province (Optional)
          </label>
          <Input
            id="province"
            value={province}
            onChange={(event) => setProvince(event.target.value)}
            placeholder="Metro Manila"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="postalCode"
          >
            Postal Code (Optional)
          </label>
          <Input
            id="postalCode"
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
            placeholder="1100"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : isEditMode
              ? "Save Changes"
              : "Create Property"}
        </Button>
      </div>
    </form>
  );
}
