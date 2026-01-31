-- AlterTable: Add teamCode to team table
ALTER TABLE "team" ADD COLUMN "teamCode" TEXT;

-- Create unique index on team.teamCode
CREATE UNIQUE INDEX "team_teamCode_key" ON "team"("teamCode");

-- AlterTable: Add teamCode to temp_team_data table
ALTER TABLE "temp_team_data" ADD COLUMN "teamCode" TEXT;

-- Create unique index on temp_team_data.teamCode  
CREATE UNIQUE INDEX "temp_team_data_teamCode_key" ON "temp_team_data"("teamCode");

-- CreateTable: Analytics table for user data statistics
CREATE TABLE "analytics" (
    "id" TEXT NOT NULL,
    "serialNo" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "teamCode" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "submitted" TEXT NOT NULL,
    "joinedAt" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "degreeType" TEXT NOT NULL,
    "educationLevel" TEXT NOT NULL,
    "graduationYear" TEXT NOT NULL,
    "collegeName" TEXT NOT NULL,
    "skills" TEXT,
    "githubUsername" TEXT,
    "portfolioUrl" TEXT,
    "bio" TEXT,
    "hackathonExperience" TEXT,
    "interestedRoles" TEXT,
    "dietaryRestrictions" TEXT,
    "tshirtSize" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "analytics_serialNo_key" ON "analytics"("serialNo");

-- CreateIndex
CREATE INDEX "analytics_teamCode_idx" ON "analytics"("teamCode");

-- CreateIndex
CREATE INDEX "analytics_userEmail_idx" ON "analytics"("userEmail");

-- Update the trigger function to include teamCode
CREATE OR REPLACE FUNCTION auto_map_user_to_team()
RETURNS TRIGGER AS $$
DECLARE
    temp_member RECORD;
    temp_team RECORD;
    team_exists BOOLEAN;
    participant_role_id TEXT;
BEGIN
    -- Get the PARTICIPANT role ID
    SELECT id INTO participant_role_id 
    FROM role 
    WHERE name = 'PARTICIPANT';
    
    -- If PARTICIPANT role doesn't exist, we can't proceed with role assignment
    IF participant_role_id IS NULL THEN
        RAISE NOTICE 'PARTICIPANT role not found in role table';
    END IF;
    -- Loop through all temp team memberships for this user's email
    FOR temp_member IN 
        SELECT * FROM temp_team_members 
        WHERE "userEmail" = NEW.email
    LOOP
        -- Check if the team already exists in the team table
        SELECT EXISTS(
            SELECT 1 FROM team WHERE id = temp_member."teamId"
        ) INTO team_exists;
        
        -- If team doesn't exist, create it from temp_team_data
        IF NOT team_exists THEN
            -- Get team data from temp_team_data
            SELECT * INTO temp_team 
            FROM temp_team_data 
            WHERE id = temp_member."teamId";
            
            -- If temp team data exists, insert into team table
            IF FOUND THEN
                INSERT INTO team (id, name, "teamCode", track, "createdAt", "updatedAt")
                VALUES (
                    temp_team.id,
                    temp_team.name,
                    temp_team."teamCode",
                    temp_team.track,
                    temp_team."createdAt",
                    temp_team."updatedAt"
                )
                ON CONFLICT (id) DO NOTHING;
            END IF;
        END IF;
        
        -- Now insert into team_member table (linking user to team)
        -- Only if team exists and user isn't already a member
        INSERT INTO team_member (id, "userId", "teamId", role, "createdAt")
        SELECT 
            gen_random_uuid()::text,
            NEW.id,
            temp_member."teamId",
            'MEMBER'::"TeamMemberRole",
            NOW()
        WHERE EXISTS (SELECT 1 FROM team WHERE id = temp_member."teamId")
        ON CONFLICT ("userId", "teamId") DO NOTHING;
        
        -- Also assign PARTICIPANT role to the user if not already assigned
        IF participant_role_id IS NOT NULL THEN
            INSERT INTO user_role (id, "userId", "roleId", "createdAt")
            VALUES (
                gen_random_uuid()::text,
                NEW.id,
                participant_role_id,
                NOW()
            )
            ON CONFLICT ("userId", "roleId") DO NOTHING;
        END IF;
        
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
