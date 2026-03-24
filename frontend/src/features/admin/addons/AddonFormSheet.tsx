"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addonSchema, type AddonDto } from "@/lib/validations/admin.schema";
import {
  useCreateAddon,
  useUpdateAddon,
} from "@/features/admin/hooks/useAdminAddons";
import { SlideOver } from "@/components/common/SlideOver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AddonCatalog } from "@/types/domain.types";

interface Props {
  addon?: AddonCatalog | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AddonFormSheet({ addon, isOpen, onClose }: Props) {
  const isEdit = !!addon;
  const { mutate: create, isPending: isCreating } = useCreateAddon();
  const { mutate: update, isPending: isUpdating } = useUpdateAddon();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<AddonDto>({
    resolver: zodResolver(addonSchema),
    defaultValues: addon
      ? {
          name: addon.name,
          category: addon.category,
          billingType: addon.billingType,
          defaultRate: addon.defaultRate ?? undefined,
          unitOfMeasure: addon.unitOfMeasure ?? undefined,
        }
      : undefined,
  });

  const billingType = useWatch({ control, name: "billingType" });
  const showRate = billingType === "FLAT_FEE" || billingType === "METERED";
  const showUnit = billingType === "METERED";

  const onSubmit = (data: AddonDto) => {
    if (isEdit) {
      update({ id: addon.id, data }, { onSuccess: handleClose });
    } else {
      create(data, { onSuccess: handleClose });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <SlideOver
      open={isOpen}
      onClose={handleClose}
      title={isEdit ? "Edit Add-on" : "Create Add-on"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Add-on Name</Label>
          <Input
            id="name"
            placeholder="e.g. WiFi, Water, Parking"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-danger-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select
            onValueChange={(v: string) =>
              setValue("category", v as AddonDto["category"])
            }
            defaultValue={addon?.category}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="internet">Internet</SelectItem>
              <SelectItem value="utility">Utility</SelectItem>
              <SelectItem value="parking">Parking</SelectItem>
              <SelectItem value="laundry">Laundry</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="pet">Pet</SelectItem>
              <SelectItem value="amenity">Amenity</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-xs text-danger-600">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Billing Type</Label>
          <Select
            onValueChange={(v: string) =>
              setValue("billingType", v as AddonDto["billingType"])
            }
            defaultValue={addon?.billingType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select billing type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FIXED_AMENITY">
                Fixed Amenity (Included)
              </SelectItem>
              <SelectItem value="FLAT_FEE">Flat Fee (Monthly)</SelectItem>
              <SelectItem value="METERED">Metered (Usage-based)</SelectItem>
            </SelectContent>
          </Select>
          {errors.billingType && (
            <p className="text-xs text-danger-600">
              {errors.billingType.message}
            </p>
          )}
        </div>

        {showRate && (
          <div className="space-y-1.5">
            <Label htmlFor="defaultRate">Default Rate (₱)</Label>
            <Input
              id="defaultRate"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("defaultRate", { valueAsNumber: true })}
            />
            {errors.defaultRate && (
              <p className="text-xs text-danger-600">
                {errors.defaultRate.message}
              </p>
            )}
          </div>
        )}

        {showUnit && (
          <div className="space-y-1.5">
            <Label htmlFor="unitOfMeasure">Unit of Measure</Label>
            <Input
              id="unitOfMeasure"
              placeholder="e.g. kWh, cubic meter, kg"
              {...register("unitOfMeasure")}
            />
            {errors.unitOfMeasure && (
              <p className="text-xs text-danger-600">
                {errors.unitOfMeasure.message}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isCreating || isUpdating}
            className="flex-1"
          >
            {isCreating || isUpdating
              ? "Saving..."
              : isEdit
                ? "Update"
                : "Create"}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}
