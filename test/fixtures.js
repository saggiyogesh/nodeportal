var data = module.exports = {
    url: "http://localhost:8081",
    admin: {
        email: "testadmin@nodeportal.com",
        password: "admin",
        userName: "testUserAdmin",
        firstName: "testUserAdmin",
        lastName: "testUserAdmin",
        roles: ["Admin"]
    },
    user: {
        userName: "testUser",
        firstName: "testUser",
        lastName: "testUser",
        email: "test@nodeportal.com",
        password: "test",
        roles: ["User"]
    },
    libPath: "../../../lib",
    redis: {
        host: "pub-redis-11916.us-east-1-3.1.ec2.garantiadata.com",
        port: "11916"
    }
};


Object.defineProperties(data, {
    home: {
        value: data.url + "/home"
    },
    settings: {
        value: data.url + "/app/settings"
    },
    appLogin: {
        value: data.url + "/app/login"
    }
});