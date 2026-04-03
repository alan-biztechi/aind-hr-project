package com.aind.hr.service;

import com.aind.hr.constant.ErrorCode;
import com.aind.hr.constant.SuccessFlag;
import com.aind.hr.exception.CustomException;
import com.aind.hr.model.entity.Employee;
import com.aind.hr.model.response.EmployeeResponse;
import com.aind.hr.model.response.UpdateResponse;
import com.aind.hr.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public List<EmployeeResponse> getEmployeeList() {
        return employeeRepository.selectAllWithDepartment();
    }

    public EmployeeResponse getEmployeeWithDepartment(Integer id) {
        return Optional.ofNullable(employeeRepository.selectWithDepartmentById(id))
                .orElseThrow(() -> new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND));
    }

    public Employee getEmployee(Integer id) {
        return Optional.ofNullable(employeeRepository.selectById(id))
                .orElseThrow(() -> new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND));
    }

    public List<Employee> getEmployeesByDepartment(Integer departmentId) {
        return employeeRepository.selectByDepartmentId(departmentId);
    }

    public UpdateResponse createEmployee(Employee employee) {
        int cnt;
        try {
            cnt = employeeRepository.insert(employee);
        } catch (Exception e) {
            throw new CustomException(ErrorCode.EMPLOYEE_CREATION_FAILED);
        }
        if (cnt == 1 && employee.getId() != null) {
            return new UpdateResponse(SuccessFlag.YES, "직원 등록 성공", employee.getId());
        }
        throw new CustomException(ErrorCode.EMPLOYEE_CREATION_FAILED);
    }

    public UpdateResponse updateEmployee(Employee employee) {
        getEmployee(employee.getId());
        employeeRepository.update(employee);
        return new UpdateResponse(SuccessFlag.YES, "직원 수정 성공", employee.getId());
    }

    public UpdateResponse deleteEmployee(Integer id) {
        getEmployee(id);
        employeeRepository.delete(id);
        return new UpdateResponse(SuccessFlag.YES, "직원 삭제 성공", id);
    }
}
