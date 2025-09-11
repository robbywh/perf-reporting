import { prisma } from "../db";

export async function findUserOrganizations(userId: string) {
  try {
    const userOrganizations = await prisma.userOrganization.findMany({
      where: {
        userId,
      },
      include: {
        organization: true,
      },
      orderBy: {
        organizationId: 'asc', // First assigned organization (alphabetical by ID for consistency)
      },
    });

    return userOrganizations.map((uo) => uo.organization);
  } catch (error) {
    console.error("Error finding user organizations:", error);
    return [];
  }
}

export async function findOrganizationById(organizationId: string) {
  try {
    return await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
    });
  } catch (error) {
    console.error("Error finding organization:", error);
    return null;
  }
}

export async function findAllOrganizations() {
  try {
    return await prisma.organization.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  } catch (error) {
    console.error("Error finding all organizations:", error);
    return [];
  }
}

export async function getOrganizationSetting(organizationId: string, param: string) {
  try {
    const setting = await prisma.setting.findUnique({
      where: {
        param_organizationId: {
          param,
          organizationId,
        },
      },
    });
    
    return setting?.value || null;
  } catch (error) {
    console.error("Error getting organization setting:", error);
    return null;
  }
}

export async function getApiTokens(organizationId: string) {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        organizationId,
        param: {
          in: [
            'CLICKUP_API_TOKEN',
            'CLICKUP_FOLDER_ID', 
            'GITLAB_GROUP_ID',
            'GITLAB_PERSONAL_ACCESS_TOKEN'
          ]
        }
      }
    });

    const tokens: Record<string, string> = {};
    settings.forEach(setting => {
      tokens[setting.param] = setting.value;
    });

    return {
      CLICKUP_API_TOKEN: tokens.CLICKUP_API_TOKEN || null,
      CLICKUP_FOLDER_ID: tokens.CLICKUP_FOLDER_ID || null,
      GITLAB_GROUP_ID: tokens.GITLAB_GROUP_ID || null,
      GITLAB_PERSONAL_ACCESS_TOKEN: tokens.GITLAB_PERSONAL_ACCESS_TOKEN || null,
    };
  } catch (error) {
    console.error("Error getting API tokens:", error);
    return {
      CLICKUP_API_TOKEN: null,
      CLICKUP_FOLDER_ID: null,
      GITLAB_GROUP_ID: null,
      GITLAB_PERSONAL_ACCESS_TOKEN: null,
    };
  }
}