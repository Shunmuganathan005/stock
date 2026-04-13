import { t } from "@/lib/locales";

export const UNITS = [
  { value: "PIECE", label: t("enums.units.PIECE") },
  { value: "BOX", label: t("enums.units.BOX") },
  { value: "KG", label: t("enums.units.KG") },
  { value: "LITER", label: t("enums.units.LITER") },
  { value: "PACK", label: t("enums.units.PACK") },
  { value: "CARTON", label: t("enums.units.CARTON") },
] as const;

export const PAYMENT_METHODS = [
  { value: "CASH", label: t("enums.paymentMethods.CASH") },
  { value: "BANK_TRANSFER", label: t("enums.paymentMethods.BANK_TRANSFER") },
  { value: "UPI", label: t("enums.paymentMethods.UPI") },
  { value: "CHEQUE", label: t("enums.paymentMethods.CHEQUE") },
] as const;

export const PAYMENT_STATUSES = [
  { value: "UNPAID", label: t("enums.paymentStatuses.UNPAID") },
  { value: "PARTIAL", label: t("enums.paymentStatuses.PARTIAL") },
  { value: "PAID", label: t("enums.paymentStatuses.PAID") },
] as const;
