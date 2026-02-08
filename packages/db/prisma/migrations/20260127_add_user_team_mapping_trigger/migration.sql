-- CreateFunction: Auto-map user to team from temp data
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
                INSERT INTO team (id, name, "teamCode", "createdAt", "updatedAt")
                VALUES (
                    temp_team.id,
                    temp_team.name,
                    temp_team."teamCode",
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

-- CreateTrigger: Trigger on user insert
CREATE TRIGGER trigger_auto_map_user_to_team
    AFTER INSERT ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION auto_map_user_to_team();

-- Add comment for documentation
COMMENT ON FUNCTION auto_map_user_to_team() IS 
'Automatically maps newly created users to teams based on temp_team_members data. Creates teams from temp_team_data if they don''t exist yet. Also assigns PARTICIPANT role to the user.';
