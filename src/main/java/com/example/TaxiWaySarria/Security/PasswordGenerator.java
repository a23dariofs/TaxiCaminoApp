package com.example.TaxiWaySarria.Security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordGenerator {
    public static void main(String[] args) {
        String rawPassword = "1234";
        String encodedPassword = new BCryptPasswordEncoder().encode(rawPassword);
        System.out.println("Contraseña encriptada: " + encodedPassword);
    }
}
