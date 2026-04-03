package com.aind.hr.model.response;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
public class AttendanceResponse {
    private Integer id;
    private Integer employeeId;
    private String employeeName;
    private String departmentName;
    private LocalDate workDate;
    private LocalTime checkIn;
    private LocalTime checkOut;
    private String status;
    private String note;
    private LocalDateTime createdAt;
}
