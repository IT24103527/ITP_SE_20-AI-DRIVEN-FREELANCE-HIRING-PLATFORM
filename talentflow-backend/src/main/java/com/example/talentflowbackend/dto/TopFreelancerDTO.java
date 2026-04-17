package com.example.talentflowbackend.dto;

public class TopFreelancerDTO {

    private String name;
    private int count;

    public TopFreelancerDTO() {}

    public TopFreelancerDTO(String name, int count) {
        this.name = name;
        this.count = count;
    }

    // ✅ Getters
    public String getName() {
        return name;
    }

    public int getCount() {
        return count;
    }

    // ✅ Setters
    public void setName(String name) {
        this.name = name;
    }

    public void setCount(int count) {
        this.count = count;
    }
}
