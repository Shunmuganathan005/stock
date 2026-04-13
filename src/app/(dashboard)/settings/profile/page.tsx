"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { t } from "@/lib/locales";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const res = await fetch("/api/users/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success(t("settings.profile.passwordChangedSuccess"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setValidationError("");
    },
    onError: (error: Error) => {
      toast.error(error.message || t("settings.profile.failedToChangePassword"));
    },
  });

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (newPassword.length < 6) {
      setValidationError(t("settings.profile.validation.passwordMinLength"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError(t("settings.profile.validation.passwordMismatch"));
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  }

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <PageHeader title={t("settings.profile.title")} description={t("settings.profile.description")} />
        <div className="flex justify-center py-12 text-muted-foreground">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("settings.profile.title")}
        description={t("settings.profile.description")}
      />

      {/* Current user info */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile.accountInfo")}</CardTitle>
          <CardDescription>
            {t("settings.profile.accountInfoDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-muted-foreground">{t("common.name")}</Label>
              <p className="font-medium">{session?.user?.name || "-"}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">{t("common.email")}</Label>
              <p className="font-medium">{session?.user?.email || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile.changePassword")}</CardTitle>
          <CardDescription>
            {t("settings.profile.changePasswordDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current-password">{t("settings.profile.currentPassword")}</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder={t("settings.profile.currentPasswordPlaceholder")}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="new-password">{t("settings.profile.newPassword")}</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setValidationError("");
                }}
                required
                placeholder={t("settings.profile.newPasswordPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t("settings.profile.confirmNewPassword")}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setValidationError("");
                }}
                required
                placeholder={t("settings.profile.confirmPasswordPlaceholder")}
              />
            </div>

            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}

            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending
                ? t("settings.profile.changing")
                : t("settings.profile.changePassword")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
