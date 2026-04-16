"use server";

import { cookies } from "next/headers";
import * as api from "@/lib/api";

async function token() {
  return (await cookies()).get("token")?.value ?? "";
}

// ── Rules ─────────────────────────────────────────────────────────────────────

export async function createRuleAction(tenantId: string, body: object) {
  return api.createRule(await token(), tenantId, body);
}

export async function updateRuleAction(tenantId: string, ruleId: string, body: object) {
  return api.updateRule(await token(), tenantId, ruleId, body);
}

export async function deleteRuleAction(tenantId: string, ruleId: string) {
  return api.deleteRule(await token(), tenantId, ruleId);
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function createUserAction(tenantId: string, body: object) {
  return api.createUser(await token(), tenantId, body);
}

export async function updateUserAction(tenantId: string, userId: string, body: object) {
  return api.updateUser(await token(), tenantId, userId, body);
}

export async function deleteUserAction(tenantId: string, userId: string) {
  return api.deleteUser(await token(), tenantId, userId);
}

export async function sendMagicLinkAction(tenantId: string, userId: string) {
  return api.sendMagicLink(await token(), tenantId, userId);
}

// ── Templates ─────────────────────────────────────────────────────────────────

export async function createTemplateAction(tenantId: string, body: object) {
  return api.createTemplate(await token(), tenantId, body);
}

export async function updateTemplateAction(
  tenantId: string,
  templateId: string,
  body: object,
) {
  return api.updateTemplate(await token(), tenantId, templateId, body);
}

export async function deleteTemplateAction(tenantId: string, templateId: string) {
  return api.deleteTemplate(await token(), tenantId, templateId);
}

export async function previewTemplateAction(
  tenantId: string,
  html_content: string,
  user_data?: object,
) {
  return api.previewTemplate(await token(), tenantId, html_content, user_data);
}

// ── Disclaimers ───────────────────────────────────────────────────────────────

export async function createDisclaimerAction(tenantId: string, body: object) {
  return api.createDisclaimer(await token(), tenantId, body);
}

export async function updateDisclaimerAction(
  tenantId: string,
  disclaimerId: string,
  body: object,
) {
  return api.updateDisclaimer(await token(), tenantId, disclaimerId, body);
}

export async function deleteDisclaimerAction(tenantId: string, disclaimerId: string) {
  return api.deleteDisclaimer(await token(), tenantId, disclaimerId);
}

// ── Domains ───────────────────────────────────────────────────────────────────

export async function addDomainAction(tenantId: string, domain: string) {
  return api.addDomain(await token(), tenantId, domain);
}

export async function deleteDomainAction(tenantId: string, domainId: string) {
  return api.deleteDomain(await token(), tenantId, domainId);
}

// ── Banners ───────────────────────────────────────────────────────────────────

export async function createBannerAction(tenantId: string, body: object) {
  return api.createBanner(await token(), tenantId, body);
}

export async function updateBannerAction(tenantId: string, bannerId: string, body: object) {
  return api.updateBanner(await token(), tenantId, bannerId, body);
}

export async function deleteBannerAction(tenantId: string, bannerId: string) {
  return api.deleteBanner(await token(), tenantId, bannerId);
}

// ── Subscription ──────────────────────────────────────────────────────────────

export async function updateSubscriptionAction(tenantId: string, body: object) {
  return api.updateSubscription(await token(), tenantId, body);
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function getAnalyticsAction(tenantId: string, days: number) {
  return api.getAnalytics(await token(), tenantId, days);
}

// ── CSV Import ────────────────────────────────────────────────────────────────

export async function importUsersCSVAction(tenantId: string, rows: object[]) {
  return api.importUsersCSV(await token(), tenantId, rows);
}

// ── Azure AD ──────────────────────────────────────────────────────────────────

export async function saveAzureConfigAction(tenantId: string, body: object) {
  return api.saveAzureConfig(await token(), tenantId, body);
}

export async function syncAzureUsersAction(tenantId: string) {
  return api.syncAzureUsers(await token(), tenantId);
}

export async function testAzureConnectionAction(tenantId: string) {
  return api.testAzureConnection(await token(), tenantId);
}
