package com.aind.hr.service;

import com.aind.hr.constant.ErrorCode;
import com.aind.hr.exception.CustomException;
import com.aind.hr.model.entity.Employee;
import com.aind.hr.model.response.UpdateResponse;
import com.aind.hr.repository.EmployeeRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private EmployeeService employeeService;

    @Test
    @DisplayName("직원 등록 성공")
    void createEmployee_success() {
        Employee employee = new Employee();
        employee.setName("테스트");
        employee.setEmail("test@aind.co.kr");
        employee.setDepartmentId(1);
        employee.setPosition("사원");
        employee.setHireDate(LocalDate.now());

        when(employeeRepository.insert(any(Employee.class))).thenAnswer(invocation -> {
            Employee arg = invocation.getArgument(0);
            arg.setId(100);
            return 1;
        });

        UpdateResponse result = employeeService.createEmployee(employee);

        assertNotNull(result);
        assertEquals(100, result.getId());
    }

    @Test
    @DisplayName("존재하지 않는 직원 조회 시 예외 발생")
    void getEmployee_notFound() {
        when(employeeRepository.selectById(999)).thenReturn(null);

        CustomException ex = assertThrows(CustomException.class,
                () -> employeeService.getEmployee(999));

        assertEquals(ErrorCode.EMPLOYEE_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("직원 삭제 시 존재 확인 후 삭제")
    void deleteEmployee_success() {
        Employee existing = new Employee();
        existing.setId(1);
        existing.setName("김민수");

        when(employeeRepository.selectById(1)).thenReturn(existing);
        when(employeeRepository.delete(1)).thenReturn(1);

        UpdateResponse result = employeeService.deleteEmployee(1);

        assertNotNull(result);
        assertEquals(1, result.getId());
    }
}
