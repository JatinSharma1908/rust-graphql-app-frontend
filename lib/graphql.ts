import { gql } from "@apollo/client";

// ── Auth ──────────────────────────────────────────────────────

export const LOGIN_MUTATION = gql`
    mutation Login($input: LoginInput!) {
        login(input: $input) {
            token
            user {
                id
                username
                email
                role
            }
        }
    }
`;

export const REGISTER_MUTATION = gql`
    mutation Register($input: RegisterInput!) {
        register(input: $input) {
            token
            user {
                id
                username
                email
                role
            }
        }
    }
`;

// ── Current user ──────────────────────────────────────────────

export const ME_QUERY = gql`
    query Me {
        me {
            id
            username
            email
            role
            status
            followerCount
            followingCount
            profilePic
        }
    }
`;