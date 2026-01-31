-- CreateTable
CREATE TABLE "temp_team_data" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "track" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temp_team_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temp_team_members" (
    "id" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temp_team_members_pkey" PRIMARY KEY ("id")
);
