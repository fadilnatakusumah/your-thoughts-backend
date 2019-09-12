exports.isEmpty = (text) => {
    if (text.trim().length === 0) return true;
    return false;
}

exports.isEmail = (text) => {
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(text);
}

exports.signupValidators = (data) => {
    let errors = {};
    if (this.isEmpty(data.name)) {
        errors.name = "Name must not be empty"
    }

    if (this.isEmpty(data.username)) {
        errors.username = "Username must not be empty"
    }

    if (this.isEmpty(data.email)) {
        errors.email = "Email must not be empty"
    } else if (!this.isEmail(data.email)) {
        errors.email = "Email must be valid"
    }

    if (this.isEmpty(data.password)) {
        errors.password = "Password must not be empty"
    }

    if (data.password !== data.confirm_password) {
        errors.confirm_password = "Password does not same"
    }

    return {
        errors,
        isValid: Object.keys(errors).length === 0
    };
}

exports.signinValidators = (data) => {
    let errors = {};
    if (this.isEmpty(data.username)) {
        errors.username = "Email/Username must not be empty"
    }

    if (this.isEmpty(data.password)) {
        errors.password = "Password must not be empty"
    }

    return {
        errors,
        isValid: Object.keys(errors).length === 0
    };
}
