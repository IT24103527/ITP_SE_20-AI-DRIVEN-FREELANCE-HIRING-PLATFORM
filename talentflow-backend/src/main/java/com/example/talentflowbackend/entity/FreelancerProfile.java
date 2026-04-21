package com.example.talentflowbackend.entity;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "freelancer_profiles")
@Data
@NoArgsConstructor
public class FreelancerProfile {
    @Id
    private String id;
    private String userId;          // references User.id
    private List<String> skills;
    private Double rating;           // average rating (1-5)
    private Integer completedJobs;   // count of completed contracts
}
