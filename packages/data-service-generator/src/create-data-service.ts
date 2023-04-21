import {
  DSGResourceData,
  Module,
  ModuleMap,
} from "@amplication/code-gen-types";
import normalize from "normalize-path";
import { createAdminModules } from "./admin/create-admin";
import DsgContext from "./dsg-context";
import { EnumResourceType } from "./models";
import { prepareContext } from "./prepare-context";
import { createServer } from "./server/create-server";
import { ILogger } from "@amplication/util/logging";

export async function createDataService(
  dSGResourceData: DSGResourceData,
  logger: ILogger,
  pluginInstallationPath?: string
): Promise<Module[]> {
  const context = DsgContext.getInstance;
  try {
    if (dSGResourceData.resourceType === EnumResourceType.MessageBroker) {
      logger.info("No code to generate for a message broker");
      return null;
    }

    const startTime = Date.now();
    await prepareContext(dSGResourceData, logger, pluginInstallationPath);

    await context.logger.info("Creating application...", {
      resourceId: dSGResourceData.resourceInfo.id,
      buildId: dSGResourceData.buildId,
    });

    const { appInfo } = context;
    const { settings } = appInfo;

    await context.logger.info("Copying static modules...");
    const serverModules = await createServer();

    const { adminUISettings } = settings;
    const { generateAdminUI } = adminUISettings;

    const adminUIModules =
      (generateAdminUI && (await createAdminModules())) || new ModuleMap();

    const modules = serverModules;
    modules.merge(adminUIModules, logger);

    // This code normalizes the path of each module to always use Unix path separator.
    modules.forEach((module) => {
      module.path = normalize(module.path);
    });

    const endTime = Date.now();
    logger.info("Application creation time", {
      durationInMs: endTime - startTime,
    });

    return Array.from(modules.values());
  } catch (error) {
    await context.logger.error("Failed to run createDataService", {
      ...error,
      data: dSGResourceData,
    });
    throw error;
  }
}
