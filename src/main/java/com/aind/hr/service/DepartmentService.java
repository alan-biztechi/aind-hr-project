package com.aind.hr.service;

import com.aind.hr.constant.ErrorCode;
import com.aind.hr.constant.SuccessFlag;
import com.aind.hr.exception.CustomException;
import com.aind.hr.model.entity.Department;
import com.aind.hr.model.response.UpdateResponse;
import com.aind.hr.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public List<Department> getDepartmentList() {
        return departmentRepository.selectAll();
    }

    public Department getDepartment(Integer id) {
        return Optional.ofNullable(departmentRepository.selectById(id))
                .orElseThrow(() -> new CustomException(ErrorCode.DEPARTMENT_NOT_FOUND));
    }

    public UpdateResponse createDepartment(Department department) {
        int cnt = departmentRepository.insert(department);
        if (cnt == 1 && department.getId() != null) {
            return new UpdateResponse(SuccessFlag.YES, "부서 생성 성공", department.getId());
        }
        throw new CustomException(ErrorCode.DEPARTMENT_CREATION_FAILED);
    }

    public UpdateResponse updateDepartment(Department department) {
        getDepartment(department.getId());
        departmentRepository.update(department);
        return new UpdateResponse(SuccessFlag.YES, "부서 수정 성공", department.getId());
    }

    public UpdateResponse deleteDepartment(Integer id) {
        getDepartment(id);
        departmentRepository.delete(id);
        return new UpdateResponse(SuccessFlag.YES, "부서 삭제 성공", id);
    }
}
