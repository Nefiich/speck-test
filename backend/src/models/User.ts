import sql from '../config/database';

export interface UserData {
  id?: bigint;
  created_at?: Date;
  google_sub?: string;
  email?: string;
  name?: string;
}

export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

class User {
  id?: bigint;
  created_at?: Date;
  google_sub?: string;
  email?: string;
  name?: string;

  constructor(data: UserData) {
    this.id = data.id;
    this.created_at = data.created_at;
    this.google_sub = data.google_sub;
    this.email = data.email;
    this.name = data.name;
  }

  static async upsertGoogleUser(profile: GoogleProfile): Promise<User> {
    try {
      const result = await sql`
        INSERT INTO users (google_sub, email, name, created_at)
        VALUES (${profile.id}, ${profile.email}, ${profile.name}, NOW())
        ON CONFLICT (google_sub)
        DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name
        RETURNING *;
      `;

      return new User(result[0]);
    } catch (error) {
      console.error('Error upserting Google user:', error);
      throw error;
    }
  }

  static async findById(id: bigint): Promise<User | null> {
    try {
      const result = await sql`SELECT * FROM users WHERE id = ${id.toString()}`;

      if (result.length === 0) {
        return null;
      }

      return new User(result[0]);
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  static async findByGoogleSub(googleSub: string): Promise<User | null> {
    try {
      const result = await sql`SELECT * FROM users WHERE google_sub = ${googleSub}`;

      if (result.length === 0) {
        return null;
      }

      return new User(result[0]);
    } catch (error) {
      console.error('Error finding user by Google Sub:', error);
      throw error;
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await sql`SELECT * FROM users WHERE email = ${email}`;

      if (result.length === 0) {
        return null;
      }

      return new User(result[0]);
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }
}

export default User;