import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export async function seedUsers() {
  const users = [
    {
      id: "user_2pOMuf7777zPYloRhu6uyfKA9XSL",
      username: "briananggriawan",
      roleId: "se",
      engineerId: 5753351,
    },
    {
      id: "user_2pQwywdUzRGDRiL4nz9NtuCjfc",
      username: "robbywh",
      roleId: "em",
    },
    {
      id: "user_2pQx3Xx7So7537Ju3mbWbs4hFa7",
      username: "kikiperwita",
      roleId: "pm",
    },
    {
      id: "user_2pQx1z5bBTzhAwNZcsfik6mrAe6",
      username: "ekopurnomo",
      roleId: "vp",
    },
    {
      id: "user_2pQx0GpqNMWBWZ9CQfacgF4LyQU",
      username: "devinmarco",
      roleId: "cto",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        username: user.username,
        roleId: user.roleId,
        engineerId: user.engineerId,
      },
      create: user,
    });
  }

  console.log("✅ Users seeded!");
}
