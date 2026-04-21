package com.example.talentflowbackend.service;
import com.example.talentflowbackend.entity.FreelancerProfile;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.FreelancerProfileRepository;
import com.example.talentflowbackend.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FreelancerProfileService {

    private final FreelancerProfileRepository profileRepository;
    private final UserRepository userRepository;

    public FreelancerProfileService(FreelancerProfileRepository profileRepository, UserRepository userRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
    }

    // Create profile for a freelancer (called after registration)
    public FreelancerProfile createProfile(String userId) {
        FreelancerProfile profile = new FreelancerProfile();
        profile.setUserId(userId);
        profile.setSkills(List.of());
        profile.setRating(0.0);
        profile.setCompletedJobs(0);
        return profileRepository.save(profile);
    }

    // Get profile of currently logged-in freelancer
    public FreelancerProfile getMyProfile() {
        String username = ((UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUsername();
        User user = userRepository.findByUsername(username);
        FreelancerProfile profile = profileRepository.findByUserId(user.getId());
        if (profile == null) {
            // Auto-create if missing (should not happen if properly initialized)
            profile = createProfile(user.getId());
        }
        return profile;
    }

    // Update skills
    public FreelancerProfile updateSkills(List<String> skills) {
        FreelancerProfile profile = getMyProfile();
        profile.setSkills(skills);
        return profileRepository.save(profile);
    }

    // Admin or internal method to get profile by user ID
    public FreelancerProfile getProfileByUserId(String userId) {
        return profileRepository.findByUserId(userId);
    }

    // Update rating and completed jobs (called after contract completion)
    public void updateFreelancerStats(String freelancerId, double newRating, int completedIncrement) {
        FreelancerProfile profile = profileRepository.findByUserId(freelancerId);
        if (profile != null) {
            // For rating, you'd normally compute average from all reviews
            // Here we'll just set to newRating (or better, recalc from all reviews)
            profile.setRating(newRating);
            profile.setCompletedJobs(profile.getCompletedJobs() + completedIncrement);
            profileRepository.save(profile);
        }
    }
}
