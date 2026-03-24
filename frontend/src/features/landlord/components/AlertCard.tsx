"use client";

import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface AlertCardProps {
  type: "error" | "warning" | "info";
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function AlertCard({ type, title, message, action }: AlertCardProps) {
  const config = {
    error: {
      icon: AlertCircle,
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      iconColor: "text-red-600",
      titleColor: "text-red-900",
      messageColor: "text-red-700",
    },
    warning: {
      icon: AlertTriangle,
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      iconColor: "text-yellow-600",
      titleColor: "text-yellow-900",
      messageColor: "text-yellow-700",
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      titleColor: "text-blue-900",
      messageColor: "text-blue-700",
    },
  };

  const {
    icon: Icon,
    bgColor,
    borderColor,
    iconColor,
    titleColor,
    messageColor,
  } = config[type];

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4`}>
      <div className="flex items-start">
        <Icon className={`w-5 h-5 ${iconColor} mt-0.5`} />
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${titleColor}`}>{title}</h3>
          <p className={`text-sm ${messageColor} mt-1`}>{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className={`text-sm font-medium ${iconColor} hover:underline mt-2`}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
