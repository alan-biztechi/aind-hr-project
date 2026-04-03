package com.aind.hr.model.response;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class EmployeeResponse {
    private Integer id;
    private String name;
    private String email;
    private String phone;
    private Integer departmentId;
    private String departmentName;
    private String position;
    private LocalDate hireDate;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
