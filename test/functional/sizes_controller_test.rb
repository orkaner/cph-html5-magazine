require 'test_helper'

class SizesControllerTest < ActionController::TestCase
  setup do
    @size = sizes(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:sizes)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create size" do
    assert_difference('Size.count') do
      post :create, size: { magtemplate_id: @size.magtemplate_id, value: @size.value, width_id: @size.width_id }
    end

    assert_redirected_to size_path(assigns(:size))
  end

  test "should show size" do
    get :show, id: @size
    assert_response :success
  end

  test "should get edit" do
    get :edit, id: @size
    assert_response :success
  end

  test "should update size" do
    put :update, id: @size, size: { magtemplate_id: @size.magtemplate_id, value: @size.value, width_id: @size.width_id }
    assert_redirected_to size_path(assigns(:size))
  end

  test "should destroy size" do
    assert_difference('Size.count', -1) do
      delete :destroy, id: @size
    end

    assert_redirected_to sizes_path
  end
end
