import Time "mo:base/Time";
import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Buffer "mo:base/Buffer";
import Int "mo:base/Int";

shared actor class Zealy() = {
    private type UserRole = {
        #superAdmin;
        #spaceAdmin;
        #member;
    };

    private type User = {
        id: Principal;
        username: Text;
        email: Text;
        passwordHash: Text;
        role: UserRole;
        createdAt: Int;
        bio: ?Text;
        avatar: ?Text;
        points: Nat;
        spaces: [Text];
    };

    private type Space = {
        id: Text;
        name: Text;
        description: Text;
        createdAt: Int;
        adminId: Principal;
        logo: ?Text;
        banner: ?Text;
        members: [Principal];
        categories: [Text];
        isPublic: Bool;
    };

    private type Task = {
        id: Text;
        spaceId: Text;
        title: Text;
        description: Text;
        points: Nat;
        taskType: TaskType;
        category: Text;
        createdAt: Int;
        deadline: ?Int;
        status: TaskStatus;
        creatorId: Principal;
        maxSubmissions: Nat;
        currentSubmissions: Nat;
        requirements: [Text];
        visibility: TaskVisibility;
    };

    private type TaskType = {
        #once;
        #daily;
        #weekly;
        #monthly;
    };

    private type TaskStatus = {
        #active;
        #paused;
        #expired;
        #archived;
    };

    private type TaskVisibility = {
        #everyone;
        #members;
        #selected;
    };

    private type TaskSubmission = {
        id: Text;
        taskId: Text;
        spaceId: Text;
        userId: Principal;
        proof: Text;
        submittedAt: Int;
        status: SubmissionStatus;
        reviewerNotes: ?Text;
        reviewerId: ?Principal;
        reviewedAt: ?Int;
    };

    private type SubmissionStatus = {
        #pending;
        #approved;
        #rejected;
    };

    private stable var superAdminPrincipal : ?Principal = null;
    private stable var _nextTaskId : Nat = 0;
    private stable var _submissionIds : [Text] = [];

    private let users = HashMap.HashMap<Principal, User>(0, Principal.equal, Principal.hash);
    private let spaces = HashMap.HashMap<Text, Space>(0, Text.equal, Text.hash);
    private let tasks = HashMap.HashMap<Text, Task>(0, Text.equal, Text.hash);
    private let submissions = HashMap.HashMap<Text, TaskSubmission>(0, Text.equal, Text.hash);

    // Helper functions
    private func _isSuperAdmin(caller: Principal) : Bool {
        switch (users.get(caller)) {
            case (?user) {
                switch (user.role) {
                    case (#superAdmin) true;
                    case (_) false;
                };
            };
            case null false;
        };
    };

    private func isSpaceAdmin(caller: Principal, spaceId: Text) : Bool {
        switch (spaces.get(spaceId)) {
            case (?space) space.adminId == caller;
            case null false;
        };
    };

    private func validateEmail(email: Text) : Bool {
        let pattern = #text("^[^@]+@[^@]+\\.[^@]+$");
        Text.contains(email, pattern);
    };

    // Public functions
    public shared({caller}) func register(username: Text, email: Text, password: Text) : async Result.Result<User, Text> {
        if (not validateEmail(email)) {
            return #err("Invalid email format");
        };
        
        switch(users.get(caller)) {
            case (?_) #err("User already exists");
            case null {
                let role = switch(superAdminPrincipal) {
                    case (null) { 
                        superAdminPrincipal := ?caller;
                        #superAdmin;
                    };
                    case (?_) #member;
                };

                let newUser : User = {
                    id = caller;
                    username = username;
                    email = email;
                    passwordHash = password;
                    role = role;
                    createdAt = Time.now();
                    bio = null;
                    avatar = null;
                    points = 0;
                    spaces = [];
                };
                users.put(caller, newUser);
                #ok(newUser);
            };
        };
    };

    public shared({caller = _}) func login(email: Text, password: Text) : async Result.Result<User, Text> {
        let userEntries = Iter.toArray(users.entries());
        for ((id, user) in userEntries.vals()) {
            if (user.email == email and user.passwordHash == password) {
                return #ok(user);
            };
        };
        #err("Invalid credentials");
    };

    public shared({caller}) func createSpace(name: Text, description: Text, isPublic: Bool) : async Result.Result<Space, Text> {
        switch (users.get(caller)) {
            case (null) #err("User not found");
            case (?user) {
                let spaceId = Text.concat(name, Int.toText(Time.now()));
                let newSpace : Space = {
                    id = spaceId;
                    name = name;
                    description = description;
                    createdAt = Time.now();
                    adminId = caller;
                    logo = null;
                    banner = null;
                    members = [caller];
                    categories = [];
                    isPublic = isPublic;
                };

                spaces.put(spaceId, newSpace);

                let updatedUser = {
                    user with
                    spaces = Array.append(user.spaces, [spaceId]);
                };
                users.put(caller, updatedUser);

                #ok(newSpace);
            };
        };
    };

    public shared({caller}) func joinSpace(spaceId: Text) : async Result.Result<Space, Text> {
        switch (users.get(caller), spaces.get(spaceId)) {
            case (?user, ?space) {
                if (not space.isPublic) {
                    return #err("This space is private");
                };

                if (Array.find(space.members, func(id: Principal) : Bool { id == caller }) != null) {
                    return #err("Already a member");
                };

                let updatedSpace = {
                    space with
                    members = Array.append(space.members, [caller]);
                };
                spaces.put(spaceId, updatedSpace);

                let updatedUser = {
                    user with
                    spaces = Array.append(user.spaces, [spaceId]);
                };
                users.put(caller, updatedUser);

                #ok(updatedSpace);
            };
            case (null, _) #err("User not found");
            case (_, null) #err("Space not found");
        };
    };

    public shared({caller}) func createTask(spaceId: Text, title: Text, description: Text, points: Nat, taskType: TaskType, visibility: TaskVisibility) : async Result.Result<Task, Text> {
        if (not isSpaceAdmin(caller, spaceId)) {
            return #err("Only space admin can create tasks");
        };

        let taskId = Text.concat(spaceId, Int.toText(Time.now()));
        let newTask : Task = {
            id = taskId;
            spaceId = spaceId;
            title = title;
            description = description;
            points = points;
            taskType = taskType;
            category = "";
            createdAt = Time.now();
            deadline = null;
            status = #active;
            creatorId = caller;
            maxSubmissions = 100;
            currentSubmissions = 0;
            requirements = [];
            visibility = visibility;
        };

        tasks.put(taskId, newTask);
        _nextTaskId += 1;
        #ok(newTask);
    };

    public query func getSpace(spaceId: Text) : async Result.Result<Space, Text> {
        switch (spaces.get(spaceId)) {
            case (?space) #ok(space);
            case null #err("Space not found");
        };
    };

    public query func getSpaceTasks(spaceId: Text) : async [Task] {
        let allTasks = Iter.toArray(tasks.vals());
        Array.filter(allTasks, func(task: Task) : Bool {
            task.spaceId == spaceId and task.status == #active
        });
    };

    public query({caller}) func getUserDetails() : async Result.Result<User, Text> {
        switch (users.get(caller)) {
            case (?user) #ok(user);
            case null #err("User not found");
        };
    };

    // New query function to get a specific task
    public query func getTask(taskId: Text) : async Result.Result<Task, Text> {
        switch (tasks.get(taskId)) {
            case (?task) { #ok(task) };
            case null { #err("Task not found") };
        };
    };

    // Get user's submission for a specific task
    public query func getUserTaskSubmission(taskId: Text, userId: Principal) : async Result.Result<TaskSubmission, Text> {
        let submissionId = Text.concat(taskId, Principal.toText(userId));
        switch (submissions.get(submissionId)) {
            case (?submission) { #ok(submission) };
            case null { #err("Submission not found") };
        };
    };

    // Get all completed tasks for a user
    public query func getUserCompletedTasks(userId: Principal) : async [Task] {
        let userSubmissions = Iter.toArray(submissions.vals());
        let completedSubmissions = Array.filter(userSubmissions, func(sub: TaskSubmission) : Bool {
            sub.userId == userId and sub.status == #approved
        });
        
        let completedTasks = Buffer.Buffer<Task>(0);
        for (submission in completedSubmissions.vals()) {
            switch (tasks.get(submission.taskId)) {
                case (?task) { completedTasks.add(task); };
                case null {};
            };
        };
        
        Buffer.toArray(completedTasks)
    };

    // Get user statistics
   public query func getUserStats(userId: Principal) : async Result.Result<{
        totalPoints: Nat;
        completedTasks: Nat;
        pendingSubmissions: Nat;
        ranking: Nat;
    }, Text> {
        switch (users.get(userId)) {
            case (?user) {
                let userSubmissions = Iter.toArray(submissions.vals());
                let pendingCount = Array.filter(userSubmissions, func(sub: TaskSubmission) : Bool {
                    sub.userId == userId and sub.status == #pending
                }).size();

                let completedCount = Array.filter(userSubmissions, func(sub: TaskSubmission) : Bool {
                    sub.userId == userId and sub.status == #approved
                }).size();

                // Calculate user ranking
                let allUsers = Iter.toArray(users.entries());
                let sortedUsers = Array.sort(allUsers, func(a: (Principal, User), b: (Principal, User)) : {#less; #equal; #greater} {
                    if (a.1.points > b.1.points) { #less }
                    else if (a.1.points < b.1.points) { #greater }
                    else { #equal }
                });

                // Find user's rank using Array.find and indexing
                let userRank = do {
                    let index = Array.indexOf<(Principal, User)>(
                        (userId, user),
                        sortedUsers,
                        func(a: (Principal, User), b: (Principal, User)) : Bool {
                            Principal.equal(a.0, b.0)
                        }
                    );
                    switch(index) {
                        case (?i) { i + 1 };
                        case null { sortedUsers.size() }; // Fallback to last place if not found
                    };
                };

                #ok({
                    totalPoints = user.points;
                    completedTasks = completedCount;
                    pendingSubmissions = pendingCount;
                    ranking = userRank;
                });
            };
            case null { #err("User not found") };
        };
    };

    // Get all spaces
    public query func getAllSpaces() : async [Space] {
        Iter.toArray(spaces.vals())
    };

    // Get global leaderboard
    public query func getLeaderboard() : async [(Principal, Text, Nat)] {
        let allUsers = Iter.toArray(users.entries());
        let sortedUsers = Array.sort(allUsers, func(a: (Principal, User), b: (Principal, User)) : {#less; #equal; #greater} {
            if (a.1.points > b.1.points) { #less }
            else if (a.1.points < b.1.points) { #greater }
            else { #equal }
        });

        let leaderboard = Buffer.Buffer<(Principal, Text, Nat)>(sortedUsers.size());
        for ((principal, user) in sortedUsers.vals()) {
            leaderboard.add((principal, user.username, user.points));
        };
        
        Buffer.toArray(leaderboard)
    };

    // Submit a task
    public shared(msg) func submitTask(taskId: Text, proof: Text) : async Result.Result<TaskSubmission, Text> {
        let caller = msg.caller;
        
        switch (tasks.get(taskId)) {
            case (?task) {
                if (task.status != #active) {
                    return #err("Task is not active");
                };

                if (task.currentSubmissions >= task.maxSubmissions) {
                    return #err("Task submission limit reached");
                };

                let submissionId = Text.concat(taskId, Principal.toText(caller));
                let submission : TaskSubmission = {
                    id = submissionId;
                    taskId = taskId;
                    spaceId = task.spaceId;
                    userId = caller;
                    proof = proof;
                    submittedAt = Time.now();
                    status = #pending;
                    reviewerNotes = null;
                    reviewerId = null;
                    reviewedAt = null;
                };

                submissions.put(submissionId, submission);

                let updatedTask = {
                    task with
                    currentSubmissions = task.currentSubmissions + 1;
                };
                tasks.put(taskId, updatedTask);

                #ok(submission);
            };
            case null { #err("Task not found"); };
        };
    };

    // System pre-upgrade and post-upgrade
    system func preupgrade() {
        _submissionIds := Iter.toArray(submissions.keys());
    };

    system func postupgrade() {
        for (submissionId in _submissionIds.vals()) {
            if (submissions.get(submissionId) == null) {
                submissions.delete(submissionId);
            };
        };
    };
};