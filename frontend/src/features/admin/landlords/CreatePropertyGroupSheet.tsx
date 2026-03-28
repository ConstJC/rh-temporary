"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { SlideOver } from "@/components/common/SlideOver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminUsers } from "@/features/admin/hooks/useAdminUsers";
import { useCreateAdminPropertyGroup } from "@/features/admin/hooks/usePropertyGroups";
import {
  createAdminPropertyGroupSchema,
  type CreateAdminPropertyGroupDto,
} from "@/lib/validations/admin.schema";

interface CreatePropertyGroupSheetProps {
  open: boolean;
  onClose: () => void;
}

const defaultValues: CreateAdminPropertyGroupDto = {
  groupName: "",
  currencyCode: "PHP",
  timezone: "Asia/Manila",
  ownerUserId: "",
};

export function CreatePropertyGroupSheet({
  open,
  onClose,
}: CreatePropertyGroupSheetProps) {
  const createMutation = useCreateAdminPropertyGroup();
  const landlordsQuery = useAdminUsers({
    page: 1,
    limit: 200,
    userType: "LANDLORD",
    isActive: true,
    sort: "createdAt",
    order: "desc",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAdminPropertyGroupDto>({
    resolver: zodResolver(createAdminPropertyGroupSchema),
    defaultValues,
  });

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  const onSubmit = async (values: CreateAdminPropertyGroupDto) => {
    const payload: CreateAdminPropertyGroupDto = {
      ...values,
      groupName: values.groupName.trim(),
      currencyCode: values.currencyCode.trim().toUpperCase(),
      timezone: values.timezone.trim(),
      ownerUserId: values.ownerUserId,
    };
    await createMutation.mutateAsync(payload);
    handleClose();
  };

  const landlordRows = landlordsQuery.data?.data ?? [];
  const eligibleLandlordRows = landlordRows.filter(
    (user) => user._count.propertyGroups === 0,
  );

  return (
    <SlideOver open={open} onClose={handleClose} title="Create Property Group">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="groupName">Group Name</Label>
          <Input id="groupName" {...register("groupName")} />
          {errors.groupName && (
            <p className="text-xs text-danger-600">{errors.groupName.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="currencyCode">Currency Code</Label>
            <Input id="currencyCode" {...register("currencyCode")} />
            {errors.currencyCode && (
              <p className="text-xs text-danger-600">
                {errors.currencyCode.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" {...register("timezone")} />
            {errors.timezone && (
              <p className="text-xs text-danger-600">{errors.timezone.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ownerUserId">Landlord Owner</Label>
          <select
            id="ownerUserId"
            {...register("ownerUserId")}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
            disabled={landlordsQuery.isLoading || eligibleLandlordRows.length === 0}
          >
            <option value="">
              {landlordsQuery.isLoading
                ? "Loading landlords..."
                : eligibleLandlordRows.length === 0
                  ? "No available landlord owners"
                  : "Select landlord owner"}
            </option>
            {eligibleLandlordRows.map((user) => (
              <option key={user.id} value={user.id}>
                {`${user.firstName} ${user.lastName} (${user.email})`}
              </option>
            ))}
          </select>
          {!landlordsQuery.isLoading && eligibleLandlordRows.length === 0 ? (
            <p className="text-xs text-slate-500">
              All active landlord owners already have an active property group.
            </p>
          ) : null}
          {errors.ownerUserId && (
            <p className="text-xs text-danger-600">{errors.ownerUserId.message}</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              createMutation.isPending ||
              landlordsQuery.isLoading ||
              eligibleLandlordRows.length === 0
            }
          >
            {createMutation.isPending ? "Creating..." : "Create Property Group"}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}

export function CreatePropertyGroupButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Property Group
      </Button>
      <CreatePropertyGroupSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
