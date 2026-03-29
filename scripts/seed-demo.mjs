import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const root = process.cwd();

async function readJson(path) {
  const content = await readFile(resolve(root, path), "utf8");
  return JSON.parse(content);
}

async function main() {
  const base = await readJson("database/seeds/base.seed.json");
  const demo = await readJson("database/seeds/demo.seed.json");

  await seedBase(base);
  await seedDemo(demo);

  console.log("Seed complete.");
}

async function seedBase(data) {
  for (const item of data.organizations ?? []) {
    await prisma.organization.upsert({
      where: { organization_id: item.organization_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.users ?? []) {
    await prisma.user.upsert({
      where: { user_id: item.user_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.memberships ?? []) {
    await prisma.membership.upsert({
      where: { membership_id: item.membership_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.oauth_identities ?? []) {
    await prisma.oAuthIdentity.upsert({
      where: { oauth_identity_id: item.oauth_identity_id },
      update: item,
      create: item,
    });
  }
}

async function seedDemo(data) {
  for (const item of data.assistant_definitions ?? []) {
    await prisma.assistantDefinition.upsert({
      where: { assistant_definition_id: item.assistant_definition_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.assistant_versions ?? []) {
    await prisma.assistantVersion.upsert({
      where: { assistant_version_id: item.assistant_version_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.assistant_instances ?? []) {
    await prisma.assistantInstance.upsert({
      where: { assistant_instance_id: item.assistant_instance_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.conversations ?? []) {
    await prisma.conversation.upsert({
      where: { conversation_id: item.conversation_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.conversation_events ?? []) {
    await prisma.conversationEvent.upsert({
      where: { conversation_event_id: item.conversation_event_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.connector_accounts ?? []) {
    await prisma.connectorAccount.upsert({
      where: { connector_account_id: item.connector_account_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.connector_sync_states ?? []) {
    await prisma.connectorSyncState.upsert({
      where: { connector_sync_state_id: item.connector_sync_state_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.notification_channels ?? []) {
    await prisma.notificationChannel.upsert({
      where: { notification_channel_id: item.notification_channel_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.notification_preferences ?? []) {
    await prisma.notificationPreference.upsert({
      where: { notification_preference_id: item.notification_preference_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.notification_messages ?? []) {
    await prisma.notificationMessage.upsert({
      where: { notification_message_id: item.notification_message_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.plans ?? []) {
    await prisma.plan.upsert({
      where: { plan_id: item.plan_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.subscriptions ?? []) {
    await prisma.subscription.upsert({
      where: { subscription_id: item.subscription_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.policies ?? []) {
    await prisma.policy.upsert({
      where: { policy_id: item.policy_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.approval_records ?? []) {
    await prisma.approvalRecord.upsert({
      where: { approval_record_id: item.approval_record_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.audit_logs ?? []) {
    await prisma.auditLog.upsert({
      where: { audit_log_id: item.audit_log_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.task_snapshots ?? []) {
    await prisma.taskSnapshot.upsert({
      where: { task_snapshot_id: item.task_snapshot_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.briefing_snapshots ?? []) {
    await prisma.briefingSnapshot.upsert({
      where: { briefing_snapshot_id: item.briefing_snapshot_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.schedules ?? []) {
    await prisma.schedule.upsert({
      where: { schedule_id: item.schedule_id },
      update: item,
      create: item,
    });
  }

  for (const item of data.jobs ?? []) {
    await prisma.job.upsert({
      where: { job_id: item.job_id },
      update: item,
      create: item,
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
