package org.example;

import jakarta.persistence.*;

@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String Name;
    private String role;

    public User() {}
    public User(String name, String role) {
        this.Name = name;
        this.role = role;
    }

    public long getId() {
        return id;
    }

    public String getName() {
        return Name;
    }

    public String getRole() {
        return role;
    }

    public void setName(String name) {
        this.Name = name;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
