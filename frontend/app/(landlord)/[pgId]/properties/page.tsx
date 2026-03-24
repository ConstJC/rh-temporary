"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { usePropertyGroup } from "@/hooks/usePropertyGroup";
import {
  useDeleteProperty,
  useProperties,
} from "@/features/landlord/hooks/useProperties";
import { useSubscription } from "@/features/landlord/hooks/useOverviewStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  Building2,
  LayoutGrid,
  List,
  MapPin,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CardSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { SlideOver } from "@/components/common/SlideOver";
import { AddPropertyForm } from "@/features/landlord/components/AddPropertyForm";
import { toFiniteNumber } from "@/lib/utils";
import type { Property } from "@/types/domain.types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type ViewMode = "cards" | "list";

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Unable to process request. Please try again.";
}

export default function PropertiesPage() {
  const { pgId } = usePropertyGroup();
  const { data: properties, isLoading } = useProperties(pgId);
  const { data: subscription } = useSubscription(pgId);
  const deleteProperty = useDeleteProperty(pgId);
  const router = useRouter();

  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [isPropertySheetOpen, setIsPropertySheetOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);

  const currentProperties = toFiniteNumber(
    subscription?.usage.properties ?? properties?.length ?? 0,
  );
  const propertyLimit = toFiniteNumber(subscription?.plan.propertyLimit);
  const remainingProperties =
    propertyLimit === 0 ? null : Math.max(0, propertyLimit - currentProperties);

  const usedUnits = toFiniteNumber(subscription?.usage.units);
  const unitLimit = toFiniteNumber(subscription?.plan.unitLimit);
  const unitLimitPerProperty = toFiniteNumber(
    subscription?.plan.unitLimitPerProperty,
  );
  const remainingOrgUnitSlots =
    unitLimit === 0 ? null : Math.max(0, unitLimit - usedUnits);
  const isPropertyLimitReached =
    remainingProperties !== null && remainingProperties <= 0;

  const propertyRows = useMemo(() => {
    return (properties ?? []).map((property) => {
      const currentUnits = toFiniteNumber(property._count?.units);
      const propertyMaxUnits = toFiniteNumber(
        (property.metadata as { maxUnits?: unknown } | undefined)?.maxUnits,
      );
      const effectiveMaxUnits =
        propertyMaxUnits > 0 && unitLimitPerProperty > 0
          ? Math.min(propertyMaxUnits, unitLimitPerProperty)
          : propertyMaxUnits > 0
            ? propertyMaxUnits
            : unitLimitPerProperty;
      const remainingPerProperty =
        effectiveMaxUnits > 0
          ? Math.max(0, effectiveMaxUnits - currentUnits)
          : null;
      const remainingLabel =
        remainingPerProperty !== null
          ? `${remainingPerProperty} unit slot${remainingPerProperty !== 1 ? "s" : ""} remaining in this property`
          : remainingOrgUnitSlots !== null
            ? `${remainingOrgUnitSlots} unit slot${remainingOrgUnitSlots !== 1 ? "s" : ""} remaining in organization`
            : "Unlimited unit slots available";
      const addressLabel = `${property.addressLine}, ${property.city}${property.province ? `, ${property.province}` : ""}`;

      return { property, currentUnits, remainingLabel, addressLabel };
    });
  }, [properties, remainingOrgUnitSlots, unitLimitPerProperty]);

  const closePropertySheet = () => {
    setIsPropertySheetOpen(false);
    setPropertyToEdit(null);
  };

  const openCreatePropertySheet = () => {
    setPropertyToEdit(null);
    setIsPropertySheetOpen(true);
  };

  const openEditPropertySheet = (property: Property) => {
    setPropertyToEdit(property);
    setIsPropertySheetOpen(true);
  };

  async function handleDeleteProperty(property: Property) {
    const confirmed = window.confirm(
      `Delete "${property.propertyName}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await deleteProperty.mutateAsync(property.id);
      toast.success("Property deleted");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const renderActionsMenu = (property: Property) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => router.push(`/${pgId}/properties/${property.id}`)}
        >
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openEditPropertySheet(property)}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={deleteProperty.isPending}
          onClick={() => {
            void handleDeleteProperty(property);
          }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Properties"
          description="Manage your properties and units"
        />
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Properties"
        description={
          remainingProperties === null
            ? "Manage your properties and units. Your plan allows unlimited properties."
            : `Manage your properties and units. You can add ${remainingProperties} more propert${remainingProperties === 1 ? "y" : "ies"}.`
        }
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              Card View
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="mr-2 h-4 w-4" />
              List View
            </Button>
            <Button
              onClick={openCreatePropertySheet}
              disabled={isPropertyLimitReached}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </div>
        }
      />

      <SlideOver
        open={isPropertySheetOpen}
        onClose={closePropertySheet}
        title={propertyToEdit ? "Edit Property" : "Add Property"}
      >
        <AddPropertyForm
          key={propertyToEdit?.id ?? "create-property"}
          onClose={closePropertySheet}
          propertyToEdit={propertyToEdit}
          onSaved={() => setPropertyToEdit(null)}
        />
      </SlideOver>

      {properties && properties.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-12 w-12" />}
          title="No properties yet"
          description="Get started by adding your first property."
          action={
            <Button
              onClick={openCreatePropertySheet}
              disabled={isPropertyLimitReached}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          }
          className="mt-6"
        />
      ) : viewMode === "list" ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>Property</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {propertyRows.map(
                ({ property, currentUnits, remainingLabel, addressLabel }) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">
                      {property.propertyName}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={property.propertyType} />
                    </TableCell>
                    <TableCell className="max-w-[360px] text-sm text-slate-600">
                      <div className="line-clamp-2">{addressLabel}</div>
                    </TableCell>
                    <TableCell>{currentUnits}</TableCell>
                    <TableCell className="max-w-[320px] text-xs text-slate-500">
                      <div className="line-clamp-2">{remainingLabel}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      {renderActionsMenu(property)}
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {propertyRows.map(
            ({ property, currentUnits, remainingLabel, addressLabel }) => (
              <Card
                key={property.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={property.propertyType} />
                      {renderActionsMenu(property)}
                    </div>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900 capitalize">
                    {property.propertyName}
                  </h3>
                  <div className="mb-4 flex items-start text-sm text-slate-600">
                    <MapPin className="mr-1 mt-0.5 h-4 w-4 shrink-0" />
                    <span className="line-clamp-2">{addressLabel}</span>
                  </div>
                  <div className="space-y-1 border-t border-slate-200 pt-4">
                    <p className="text-sm text-slate-600">
                      {currentUnits} unit{currentUnits !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-slate-500">{remainingLabel}</p>
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}
    </>
  );
}
