package com.ecommerce.project;

import com.ecommerce.project.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class EcommerceApplication implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public static void main(String[] args) {
        SpringApplication.run(EcommerceApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        userRepository.findByUsername("shiva").ifPresent(user -> {
            user.setPassword(passwordEncoder.encode("112233"));
            userRepository.save(user);
            System.out.println("=================================================");
            System.out.println("SUCCESS: Password for user 'shiva' updated to '112233'!");
            System.out.println("=================================================");
        });
    }
}
